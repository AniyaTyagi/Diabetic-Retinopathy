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
    )
    filename = f"{r.report_id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
