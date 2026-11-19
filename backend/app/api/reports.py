from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Patient, Report, Screening, User
from app.schemas import ReportOut
from app.services.report_pdf import build_report_pdf

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("", response_model=list[ReportOut])
def list_reports(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    rows = (
        db.query(Report, Patient)
        .join(Patient, Report.patient_pk == Patient.id)
        .order_by(Report.id.desc())
        .all()
    )
    return [
        ReportOut(
            report_id=r.report_id,
            patient_id=p.patient_id,
            patient_name=p.full_name,
            severity=r.severity,
            date=r.report_date,
            status=r.status,
            screening_id=r.screening_id,
        )
        for r, p in rows
    ]


def _report_row(db: Session, report_id: str):
    return (
        db.query(Report, Patient)
        .join(Patient, Report.patient_pk == Patient.id)
        .filter(Report.report_id == report_id)
        .first()
    )


@router.get("/{report_id}", response_model=ReportOut)
def get_report(
    report_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    row = _report_row(db, report_id)
    if not row:
        raise HTTPException(status_code=404, detail="Report not found")
    r, p = row
    return ReportOut(
        report_id=r.report_id,
        patient_id=p.patient_id,
        patient_name=p.full_name,
        severity=r.severity,
        date=r.report_date,
        status=r.status,
        screening_id=r.screening_id,
    )


@router.get("/{report_id}/pdf")
def download_report_pdf(
    report_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    row = _report_row(db, report_id)
    if not row:
        raise HTTPException(status_code=404, detail="Report not found")
    r, p = row

    screening = None
    if r.screening_id:
        screening = db.query(Screening).filter(Screening.screening_id == r.screening_id).first()

    # Extract quality status from quality_json blob if available
    quality_status: str | None = None
    quality_score: float | None = None
    od_gradcam_overlay: str | None = None
    os_gradcam_overlay: str | None = None
    od_gradcam_heatmap: str | None = None
    os_gradcam_heatmap: str | None = None
    model_compare: dict | None = None
    per_eye: list[dict] = []
    if screening:
        quality_score = screening.quality_score
        try:
            import json as _json
            if screening.quality_json:
                q = _json.loads(screening.quality_json)
                quality_status = q.get("status_label")
            if screening.explainability_json:
                exp = _json.loads(screening.explainability_json)
                grad = exp.get("gradcam") or {}
                if isinstance(grad.get("od"), dict):
                    od_gradcam_overlay = grad["od"].get("overlay_path")
                if isinstance(grad.get("os"), dict):
                    os_gradcam_overlay = grad["os"].get("overlay_path")
                if isinstance(grad.get("od"), dict):
                    od_gradcam_heatmap = grad["od"].get("heatmap_path")
                if isinstance(grad.get("os"), dict):
                    os_gradcam_heatmap = grad["os"].get("heatmap_path")
                if isinstance(exp.get("model_compare"), dict):
                    model_compare = exp["model_compare"]
                for item in exp.get("per_eye") or []:
                    if not isinstance(item, dict):
                        continue
                    img = item.get("image_path")
                    eye = "od" if img and img == screening.od_image_path else (
                        "os" if img and img == screening.os_image_path else ""
                    )
                    per_eye.append({
                        "eye": eye,
                        "dr_level": item.get("dr_level"),
                        "confidence": item.get("confidence"),
                    })
        except Exception:  # noqa: BLE001
            pass

    pdf_bytes = build_report_pdf(
        report_id=r.report_id,
        patient_id=p.patient_id,
        patient_name=p.full_name or "—",
        age=p.age,
        gender=p.gender,
        center=p.center,
        severity=r.severity,
        date=r.report_date,
        status=r.status,
        screening_id=r.screening_id,
        confidence=screening.confidence if screening else None,
        referral_needed=screening.referral_needed if screening else None,
        model_used=screening.model_used if screening else None,
        quality_score=quality_score,
        quality_status=quality_status,
        review_status=screening.review_status if screening else None,
        reviewed_by=getattr(screening, "reviewed_by", None) if screening else None,
        clinician_dr_level=getattr(screening, "clinician_dr_level", None) if screening else None,
        clinician_decision=getattr(screening, "clinician_decision", None) if screening else None,
        review_notes=getattr(screening, "review_notes", None) if screening else None,
        reviewer_override=getattr(screening, "reviewer_override", False) if screening else False,
        od_image_path=screening.od_image_path if screening else None,
        os_image_path=screening.os_image_path if screening else None,
        od_gradcam_overlay=od_gradcam_overlay,
        os_gradcam_overlay=os_gradcam_overlay,
        od_gradcam_heatmap=od_gradcam_heatmap,
        os_gradcam_heatmap=os_gradcam_heatmap,
        dr_level=screening.dr_level if screening else None,
        model_compare=model_compare,
        per_eye=per_eye,
    )
    filename = f"{r.report_id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
