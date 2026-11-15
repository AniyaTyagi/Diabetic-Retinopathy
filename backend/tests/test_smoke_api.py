"""API smoke path: register → patient → screening → quality → analyze → results/settings."""

from __future__ import annotations

import os

# Force SQLite before app imports bind the engine
os.environ["DATABASE_URL"] = "sqlite:///./test_smoke.db"
# Keep smoke tests fast — do not load DINOv2 / QML weights
os.environ["NETRAX_CNN_ENABLED"] = "0"
os.environ["NETRAX_QML_ENABLED"] = "0"

from fastapi.testclient import TestClient

from app.database import Base, SessionLocal, engine
from app.main import app
from app.schema_sync import ensure_schema
from app.services.defaults import ensure_platform_defaults


def setup_module() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    ensure_schema()
    db = SessionLocal()
    try:
        ensure_platform_defaults(db)
    finally:
        db.close()


client = TestClient(app)


def _auth_headers(email: str = "smoke@netrax.health", password: str = "netrax123") -> dict[str, str]:
    # Register if smoke user
    if email.startswith("smoke"):
        client.post(
            "/api/auth/register",
            json={"email": email, "password": password, "full_name": "Smoke Tester", "center": "PHC Shivapur"},
        )
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_seedless_platform_endpoints():
    h = _auth_headers()
    for path in (
        "/api/settings",
        "/api/ops/status",
        "/api/analytics/summary",
        "/api/analytics/models",
        "/api/analytics/quality",
        "/api/simulation/capacity",
        "/api/simulation/defaults",
    ):
        r = client.get(path, headers=h)
        assert r.status_code == 200, f"{path}: {r.status_code} {r.text}"


def test_screening_quality_analyze_report_evidence():
    h = _auth_headers()

    pid = "P90001"
    pr = client.post(
        "/api/patients",
        headers=h,
        json={
            "patient_id": pid,
            "full_name": "Smoke Patient",
            "age": 55,
            "gender": "F",
            "center": "PHC Shivapur",
        },
    )
    if pr.status_code not in (200, 201):
        # upsert via patch path if create conflicts — try get
        assert client.get(f"/api/patients/{pid}", headers=h).status_code == 200

    sr = client.post("/api/screenings", headers=h, json={"patient_id": pid, "center": "PHC Shivapur"})
    assert sr.status_code == 201, sr.text
    sid = sr.json()["screening_id"]

    # Generate valid JPEG image in memory for Pillow decodability
    import io
    from PIL import Image
    buf = io.BytesIO()
    Image.new("RGB", (300, 300), color=(180, 50, 40)).save(buf, format="JPEG")
    jpeg_bytes = buf.getvalue()

    files = {
        "od": ("od.jpg", jpeg_bytes, "image/jpeg"),
        "os": ("os.jpg", jpeg_bytes, "image/jpeg"),
    }
    up = client.post(f"/api/screenings/{sid}/images", headers=h, files=files)
    assert up.status_code == 200, up.text

    qr = client.post(f"/api/screenings/{sid}/quality", headers=h)
    assert qr.status_code == 200, qr.text
    body = qr.json()
    assert body["score"] >= 40
    assert len(body["checks"]) >= 3

    ar = client.post(f"/api/screenings/{sid}/analyze", headers=h, json={"model": "ensemble"})
    assert ar.status_code == 200, ar.text
    assert ar.json().get("report_id")

    rr = client.get(f"/api/screenings/{sid}/results", headers=h)
    assert rr.status_code == 200, rr.text
    results = rr.json()
    assert results["explainability"]
    assert results["report_id"]

    report_id = results["report_id"]
    gr = client.get(f"/api/reports/{report_id}", headers=h)
    assert gr.status_code == 200, gr.text
    assert gr.json()["screening_id"] == sid

    # Verify Operator cannot submit clinical reviews (forbidden)
    op_rev = client.post(
        f"/api/screenings/{sid}/review",
        headers=h,
        json={"clinician_dr_level": 3, "clinician_decision": "confirm"},
    )
    assert op_rev.status_code == 403

    # Verify clinician review submission preserves original AI prediction
    h_rev = _auth_headers(email="reviewer@netrax.health")
    rev_res = client.post(
        f"/api/screenings/{sid}/review",
        headers=h_rev,
        json={
            "clinician_dr_level": 3,
            "clinician_decision": "modify",
            "review_notes": "Clinician confirms severe signs requiring specialist attention.",
            "reviewer_override": True,
        },
    )
    assert rev_res.status_code == 200, rev_res.text
    rev_data = rev_res.json()
    assert rev_data["review_status"] == "completed"
    assert rev_data["clinician_dr_level"] == 3
    assert rev_data["reviewer_override"] is True
    # Confirm AI prediction is preserved
    assert rev_data["dr_level"] == results["dr_level"]

    # Test PDF download
    pdf_res = client.get(f"/api/reports/{report_id}/pdf", headers=h)
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert pdf_res.content.startswith(b"%PDF-")
    assert len(pdf_res.content) > 1000

    # Test automation log audit trail (n8n webhook dispatch)
    auto_res = client.get("/api/automation/logs", headers=h)
    assert auto_res.status_code == 200
    logs = auto_res.json()
    assert len(logs) >= 2
    event_types = [entry["event_type"] for entry in logs]
    assert "screening.created" in event_types
    assert "screening.reviewed" in event_types

    # Test retry endpoint
    first_log_id = logs[0]["id"]
    retry_res = client.post(f"/api/automation/logs/{first_log_id}/retry", headers=h)
    assert retry_res.status_code == 200
    assert retry_res.json()["id"] == first_log_id

    # Test detailed health endpoint
    health_det = client.get("/api/health/detailed")
    assert health_det.status_code == 200
    h_body = health_det.json()
    assert h_body["status"] in ("ok", "degraded")
    assert "database" in h_body
    assert "uploads" in h_body
    assert "ml" in h_body

    # Test follow-up scheduling (Operator forbidden, Ophthalmologist authorized)
    fu_forbidden = client.post(
        f"/api/screenings/{sid}/follow-up",
        headers=h,
        json={
            "follow_up_date": "2026-12-01",
            "follow_up_center": "District Hospital Eye Clinic",
            "follow_up_notes": "Referral for dilated exam and potential laser therapy",
        },
    )
    assert fu_forbidden.status_code == 403

    h_ophtho = _auth_headers(email="ophtho@netrax.health")
    fu_res = client.post(
        f"/api/screenings/{sid}/follow-up",
        headers=h_ophtho,
        json={
            "follow_up_date": "2026-12-01",
            "follow_up_center": "District Hospital Eye Clinic",
            "follow_up_notes": "Referral for dilated exam and potential laser therapy",
        },
    )
    assert fu_res.status_code == 200
    assert fu_res.json()["follow_up_center"] == "District Hospital Eye Clinic"

    # Test patient consent preservation
    p_check = client.get(f"/api/patients/{pid}", headers=h)
    assert p_check.status_code == 200
    assert p_check.json().get("consent_obtained") is True

    # Test creating patient with explicit consent=False
    p_noconsent = client.post(
        "/api/patients",
        headers=h,
        json={
            "patient_id": "P90002",
            "full_name": "No Consent Patient",
            "age": 42,
            "gender": "M",
            "center": "PHC Shivapur",
            "consent_obtained": False,
        },
    )
    assert p_noconsent.status_code in (200, 201)
    assert p_noconsent.json()["consent_obtained"] is False
