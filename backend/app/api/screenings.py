import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.ml import DR_LABELS, analyze
from app.ml.gradcam import generate_gradcam
from app.models import Notification, Patient, Report, Screening, User
from app.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    FollowUpIn,
    FollowUpOut,
    QualityAssessmentOut,
    QualityCheckOut,
    ResultsOut,
    ScreeningCreate,
    ScreeningListItem,
    ScreeningOut,
    ScreeningStepUpdate,
)
from app.services.screening_artifacts import (
    assess_image_quality,
    build_explainability,
    build_lesions,
    build_structure,
    dumps,
    loads,
)

router = APIRouter(prefix="/screenings", tags=["screenings"])

UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def _next_screening_id(db: Session) -> str:
    """Allocate NQ-{n} from max existing suffix (not row count — avoids collisions after deletes/gaps)."""
    ids = [row[0] for row in db.query(Screening.screening_id).all()]
    max_n = 2799
    for sid in ids:
        if not sid or not sid.startswith("NQ-"):
            continue
        suffix = sid[3:]
        if suffix.isdigit():
            max_n = max(max_n, int(suffix))
    return f"NQ-{max_n + 1}"


def _safe_store_name(original: str | None, prefix: str) -> str:
    name = Path(original or f"{prefix}.jpg").name
    # Strip path separators / traversal
    name = name.replace("..", "").replace("/", "_").replace("\\", "_")
    return f"{prefix}_{uuid.uuid4().hex[:8]}_{name}"


def _report_id_for(screening_id: str) -> str:
    suffix = screening_id.replace("NQ-", "")
    return f"RPT-{suffix}"


def _severity_label(dr_level: int | None) -> str:
    if dr_level is None:
        return "Pending"
    return DR_LABELS.get(int(dr_level), f"Level {dr_level}")


def _fill_report(report: Report, screening: Screening, *, rid: str, date_str: str, severity: str) -> None:
    report.report_id = rid
    report.patient_pk = screening.patient_pk
    report.screening_id = screening.screening_id
    report.severity = severity
    report.report_date = date_str
    if screening.review_status == "completed":
        report.status = "verified"
    elif report.status not in {"verified"}:
        report.status = "pending"


def _upsert_report(db: Session, screening: Screening) -> Report:
    """One report per screening / RPT-* id — update in place, never duplicate-insert."""
    rid = _report_id_for(screening.screening_id)
    date_str = screening.screening_date or datetime.utcnow().strftime("%d %b %Y")
    severity = _severity_label(screening.dr_level)

    report = (
        db.query(Report)
        .filter((Report.report_id == rid) | (Report.screening_id == screening.screening_id))
        .order_by(Report.id.asc())
        .first()
    )
    if report:
        _fill_report(report, screening, rid=rid, date_str=date_str, severity=severity)
        return report

    report = Report(
        report_id=rid,
        patient_pk=screening.patient_pk,
        screening_id=screening.screening_id,
        severity=severity,
        report_date=date_str,
        status="verified" if screening.review_status == "completed" else "pending",
    )
    try:
        # SAVEPOINT so a race UniqueViolation does not wipe screening updates
        with db.begin_nested():
            db.add(report)
            db.flush()
    except IntegrityError:
        existing = (
            db.query(Report)
            .filter((Report.report_id == rid) | (Report.screening_id == screening.screening_id))
            .order_by(Report.id.asc())
            .first()
        )
        if not existing:
            raise
        _fill_report(existing, screening, rid=rid, date_str=date_str, severity=severity)
        return existing
    return report


def _sync_patient_from_screening(patient: Patient, screening: Screening) -> None:
    patient.latest_dr_level = screening.dr_level
    patient.latest_confidence = screening.confidence
    patient.last_screening_date = screening.screening_date or datetime.utcnow().strftime("%d %b %Y")
    if screening.referral_needed:
        patient.queue_status = "referable"
    elif screening.dr_level is not None:
        patient.queue_status = {0: "normal", 1: "mild", 2: "referable", 3: "severe", 4: "pdr"}.get(
            screening.dr_level, "pending"
        )


@router.get("", response_model=list[ScreeningListItem])
def list_screenings(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    rows = (
        db.query(Screening, Patient)
        .join(Patient, Screening.patient_pk == Patient.id)
        .order_by(Screening.id.desc())
        .all()
    )
    return [
        ScreeningListItem(
            screening_id=s.screening_id,
            patient_id=p.patient_id,
            center=s.center,
            date=s.screening_date or s.created_at.strftime("%d %b %Y"),
            dr_level=s.dr_level,
            confidence=s.confidence,
            model_used=s.model_used,
            review_status=s.review_status,
        )
        for s, p in rows
    ]


@router.post("", response_model=ScreeningOut, status_code=status.HTTP_201_CREATED)
def create_screening(
    body: ScreeningCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    patient = db.query(Patient).filter(Patient.patient_id == body.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found — create patient first")
    # Retry on rare race where two creates pick the same next id
    last_err: Exception | None = None
    for _ in range(5):
        screening = Screening(
            screening_id=_next_screening_id(db),
            patient_pk=patient.id,
            center=body.center or patient.center,
            status="created",
            step="created",
            screening_date=datetime.utcnow().strftime("%d %b %Y"),
        )
        db.add(screening)
        try:
            db.commit()
            db.refresh(screening)
            return screening
        except IntegrityError as e:
            last_err = e
            db.rollback()
    raise HTTPException(
        status_code=409,
        detail=f"Could not allocate unique screening_id: {last_err}",
    )


@router.get("/{screening_id}", response_model=ScreeningOut)
def get_screening(
    screening_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    screening = db.query(Screening).filter(Screening.screening_id == screening_id).first()
    if not screening:
        raise HTTPException(status_code=404, detail="Screening not found")
    return screening


@router.patch("/{screening_id}/step", response_model=ScreeningOut)
def update_step(
    screening_id: str,
    body: ScreeningStepUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    screening = db.query(Screening).filter(Screening.screening_id == screening_id).first()
    if not screening:
        raise HTTPException(status_code=404, detail="Screening not found")
    screening.step = body.step
    if body.status:
        screening.status = body.status
    if body.quality_score is not None:
        screening.quality_score = body.quality_score
    if body.review_status is not None:
        screening.review_status = body.review_status
        if body.review_status == "completed":
            _upsert_report(db, screening)
    if body.referral_needed is not None:
        screening.referral_needed = body.referral_needed
    db.commit()
    db.refresh(screening)
    return screening


@router.post("/{screening_id}/follow-up", response_model=FollowUpOut)
def schedule_follow_up(
    screening_id: str,
    body: FollowUpIn,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    screening = db.query(Screening).filter(Screening.screening_id == screening_id).first()
    if not screening:
        raise HTTPException(status_code=404, detail="Screening not found")
    patient = db.query(Patient).filter(Patient.id == screening.patient_pk).first()

    date = body.follow_up_date.strip()
    center = body.follow_up_center.strip()
    if not date or not center:
        raise HTTPException(status_code=400, detail="follow_up_date and follow_up_center are required")

    screening.follow_up_date = date
    screening.follow_up_center = center
    screening.follow_up_notes = (body.follow_up_notes or "").strip() or None

    db.add(
        Notification(
            category="Review Required",
            title=f"Follow-up scheduled · {patient.patient_id if patient else screening_id}",
            detail=f"{patient.full_name if patient else 'Patient'} · {center} on {date}",
            time_label=datetime.utcnow().strftime("%d %b %Y %H:%M"),
            path=f"/screening/referral?sid={screening_id}",
            is_read=False,
        )
    )
    db.commit()
    db.refresh(screening)
    return FollowUpOut(
        screening_id=screening.screening_id,
        follow_up_date=screening.follow_up_date,
        follow_up_center=screening.follow_up_center,
        follow_up_notes=screening.follow_up_notes,
    )


@router.post("/{screening_id}/images", response_model=ScreeningOut)
async def upload_images(
    screening_id: str,
    od: UploadFile | None = File(None),
    os_eye: UploadFile | None = File(None, alias="os"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    screening = db.query(Screening).filter(Screening.screening_id == screening_id).first()
    if not screening:
        raise HTTPException(status_code=404, detail="Screening not found")

    folder = UPLOAD_DIR / screening_id
    folder.mkdir(parents=True, exist_ok=True)

    if od is not None:
        od_path = folder / _safe_store_name(od.filename, "OD")
        od_path.write_bytes(await od.read())
        # Store path relative to uploads root for portability
        screening.od_image_path = str(od_path)

    if os_eye is not None:
        os_path = folder / _safe_store_name(os_eye.filename, "OS")
        os_path.write_bytes(await os_eye.read())
        screening.os_image_path = str(os_path)

    screening.step = "uploaded"
    screening.status = "uploaded"
    db.commit()
    db.refresh(screening)
    return screening


def _resolve_eye_path(screening: Screening, eye: str) -> Path:
    key = eye.lower()
    if key == "od":
        raw = screening.od_image_path
    elif key == "os":
        raw = screening.os_image_path
    else:
        raise HTTPException(status_code=400, detail="eye must be od or os")
    if not raw:
        raise HTTPException(status_code=404, detail=f"No {key.upper()} image uploaded")
    path = Path(raw)
    if not path.is_file():
        raise HTTPException(status_code=404, detail=f"{key.upper()} image file missing on disk")
    return path


@router.get("/{screening_id}/images/{eye}")
def get_screening_image(
    screening_id: str,
    eye: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    screening = db.query(Screening).filter(Screening.screening_id == screening_id).first()
    if not screening:
        raise HTTPException(status_code=404, detail="Screening not found")
    path = _resolve_eye_path(screening, eye)
    media = "image/jpeg"
    suf = path.suffix.lower()
    if suf == ".png":
        media = "image/png"
    elif suf in {".webp"}:
        media = "image/webp"
    return FileResponse(path, media_type=media, filename=path.name)


@router.get("/{screening_id}/gradcam/{eye}/{kind}")
def get_gradcam_image(
    screening_id: str,
    eye: str,
    kind: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if kind not in {"heatmap", "overlay"}:
        raise HTTPException(status_code=400, detail="kind must be heatmap or overlay")
    screening = db.query(Screening).filter(Screening.screening_id == screening_id).first()
    if not screening:
        raise HTTPException(status_code=404, detail="Screening not found")
    explain = loads(screening.explainability_json) or {}
    grad = (explain.get("gradcam") or {}).get(eye.lower()) or {}
    raw = grad.get(f"{kind}_path")
    if not raw:
        raise HTTPException(status_code=404, detail="Grad-CAM not generated for this eye")
    path = Path(raw)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Grad-CAM file missing")
    return FileResponse(path, media_type="image/png", filename=path.name)


@router.post("/{screening_id}/quality", response_model=QualityAssessmentOut)
def assess_quality(
    screening_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    screening = db.query(Screening).filter(Screening.screening_id == screening_id).first()
    if not screening:
        raise HTTPException(status_code=404, detail="Screening not found")

    payload = assess_image_quality(screening.od_image_path, screening.os_image_path)
    screening.quality_score = float(payload["score"])
    screening.quality_json = dumps(payload)
    screening.step = "quality"
    screening.status = "quality_ok" if payload["suitable"] else "quality_poor"
    db.commit()

    return QualityAssessmentOut(
        screening_id=screening.screening_id,
        score=float(payload["score"]),
        suitable=bool(payload["suitable"]),
        status_label=str(payload["status_label"]),
        checks=[QualityCheckOut(**c) for c in payload["checks"]],
        fundus_variant=str(payload.get("fundus_variant", "moderate")),
        step=screening.step,
        status=screening.status,
    )


@router.post("/{screening_id}/analyze", response_model=AnalyzeResponse)
def analyze_screening(
    screening_id: str,
    body: AnalyzeRequest | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    Run AI analysis. CNN (DINOv2) + Hybrid QML ensemble are live.
    Model weights under app/ml/weights are loaded read-only.
    """
    screening = db.query(Screening).filter(Screening.screening_id == screening_id).first()
    if not screening:
        raise HTTPException(status_code=404, detail="Screening not found")

    patient = db.query(Patient).filter(Patient.id == screening.patient_pk).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    model = (body.model if body else "ensemble")
    paths = [p for p in [screening.od_image_path, screening.os_image_path] if p]
    try:
        result = analyze(model=model, image_paths=paths or None)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001 — surface inference errors to client
        raise HTTPException(status_code=500, detail=f"Inference failed: {exc}") from exc

    screening.dr_level = result.dr_level
    screening.confidence = result.confidence
    screening.model_used = result.model_used
    screening.referral_needed = result.referral_needed
    explain = build_explainability(result.dr_level, result.confidence)
    if isinstance(result.details, dict):
        if result.details.get("model_compare"):
            explain["model_compare"] = result.details["model_compare"]
        explain["inference"] = {
            "model_used": result.model_used,
            "cnn": result.details.get("cnn"),
            "qml": result.details.get("qml"),
            "winner": result.details.get("winner"),
            "note": result.details.get("note"),
        }
        if result.details.get("per_eye"):
            explain["per_eye"] = result.details["per_eye"]
        elif isinstance(result.details.get("cnn"), dict) and result.details["cnn"].get("per_eye"):
            explain["per_eye"] = result.details["cnn"]["per_eye"]

    gradcam_meta: dict = {}
    folder = UPLOAD_DIR / screening.screening_id
    for eye_key, img_path in (("od", screening.od_image_path), ("os", screening.os_image_path)):
        if not img_path or not Path(img_path).is_file():
            continue
        try:
            gc = generate_gradcam(img_path, folder, stem=eye_key)
            gradcam_meta[eye_key] = {
                "heatmap_path": gc["heatmap_path"],
                "overlay_path": gc["overlay_path"],
                "predicted_class": gc["predicted_class"],
                "source": "CNN-DINOv2-gradcam",
            }
        except Exception as exc:  # noqa: BLE001
            gradcam_meta[eye_key] = {"error": str(exc), "source": "failed"}
    if gradcam_meta:
        explain["gradcam"] = gradcam_meta
        explain["summary"] = (
            f"Grad-CAM from DINOv2 attention for predicted class "
            f"(confidence {result.confidence:.2f})."
        )
        explain["disclaimer"] = (
            "Grad-CAM highlights CNN attention for the predicted class. "
            "Assistive only — confirm with clinician review."
        )

    screening.explainability_json = dumps(explain)
    screening.lesions_json = dumps(build_lesions(result.dr_level))
    screening.structure_json = dumps(build_structure(result.dr_level))
    screening.step = "results"
    screening.status = "results"
    screening.review_status = "pending"
    if not screening.screening_date:
        screening.screening_date = datetime.utcnow().strftime("%d %b %Y")

    report = _upsert_report(db, screening)
    _sync_patient_from_screening(patient, screening)
    db.commit()

    return AnalyzeResponse(
        screening_id=screening.screening_id,
        status=screening.status,
        step=screening.step,
        dr_level=result.dr_level,
        confidence=result.confidence,
        model_used=result.model_used,
        referral_needed=result.referral_needed,
        message=str(result.details.get("note") or result.details.get("label") or "Analysis complete"),
        report_id=report.report_id,
    )


@router.get("/{screening_id}/results", response_model=ResultsOut)
def get_results(
    screening_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    row = (
        db.query(Screening, Patient)
        .join(Patient, Screening.patient_pk == Patient.id)
        .filter(Screening.screening_id == screening_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Screening not found")
    s, p = row
    report = db.query(Report).filter(Report.screening_id == s.screening_id).first()
    explain = loads(s.explainability_json)
    return ResultsOut(
        screening_id=s.screening_id,
        patient_id=p.patient_id,
        patient_name=p.full_name,
        center=s.center,
        date=s.screening_date or s.created_at.strftime("%d %b %Y"),
        dr_level=s.dr_level,
        confidence=s.confidence,
        model_used=s.model_used,
        referral_needed=s.referral_needed,
        review_status=s.review_status,
        quality_score=s.quality_score,
        step=s.step,
        status=s.status,
        report_id=report.report_id if report else None,
        has_od_image=bool(s.od_image_path and Path(s.od_image_path).is_file()),
        has_os_image=bool(s.os_image_path and Path(s.os_image_path).is_file()),
        per_eye=(explain or {}).get("per_eye") if isinstance(explain, dict) else None,
        quality=loads(s.quality_json),
        explainability=explain,
        lesions=loads(s.lesions_json),
        structure=loads(s.structure_json),
        follow_up_date=s.follow_up_date,
        follow_up_center=s.follow_up_center,
        follow_up_notes=s.follow_up_notes,
    )
