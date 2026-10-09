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


def _auth_headers() -> dict[str, str]:
    email = "smoke@netrax.health"
    password = "netrax123"
    # Register (ignore if already exists)
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

    # Tiny fake image files
    files = {
        "od": ("od.jpg", b"x" * 50_000, "image/jpeg"),
        "os": ("os.jpg", b"x" * 50_000, "image/jpeg"),
    }
    up = client.post(f"/api/screenings/{sid}/images", headers=h, files=files)
    assert up.status_code == 200, up.text

    qr = client.post(f"/api/screenings/{sid}/quality", headers=h)
    assert qr.status_code == 200, qr.text
    body = qr.json()
    assert body["score"] >= 70
    assert body["suitable"] is True
    assert len(body["checks"]) >= 4

    ar = client.post(f"/api/screenings/{sid}/analyze", headers=h, json={"model": "ensemble"})
    assert ar.status_code == 200, ar.text
    assert ar.json().get("report_id")

    rr = client.get(f"/api/screenings/{sid}/results", headers=h)
    assert rr.status_code == 200, rr.text
    results = rr.json()
    assert results["explainability"]
    assert results["lesions"]
    assert results["structure"]
    assert results["report_id"]

    report_id = results["report_id"]
    gr = client.get(f"/api/reports/{report_id}", headers=h)
    assert gr.status_code == 200, gr.text
    assert gr.json()["screening_id"] == sid
