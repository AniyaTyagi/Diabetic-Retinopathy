from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_roles
from app.models import Patient, User
from app.roles import ROLE_ADMIN, ROLE_OPERATOR, ROLE_OPHTHALMOLOGIST, ROLE_REVIEWER
from app.schemas import PatientCreate, PatientOut, PatientUpdate

router = APIRouter(prefix="/patients", tags=["patients"])

_clinical = require_roles(ROLE_OPERATOR, ROLE_OPHTHALMOLOGIST, ROLE_REVIEWER, ROLE_ADMIN)


def _next_patient_id(db: Session) -> str:
    """Allocate P{n} from max existing numeric suffix (not timestamp — avoids collisions)."""
    ids = [row[0] for row in db.query(Patient.patient_id).all()]
    max_n = 10000
    for pid in ids:
        if not pid or not pid.upper().startswith("P"):
            continue
        suffix = pid[1:]
        if suffix.isdigit():
            max_n = max(max_n, int(suffix))
    return f"P{max_n + 1}"


@router.get("", response_model=list[PatientOut])
def list_patients(
    q: str | None = Query(None, description="Search name or patient_id"),
    center: str | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(_clinical),
):
    query = db.query(Patient)
    if q:
        like = f"%{q}%"
        query = query.filter((Patient.full_name.ilike(like)) | (Patient.patient_id.ilike(like)))
    if center and center != "All":
        query = query.filter(Patient.center == center)
    return query.order_by(Patient.id.desc()).all()


@router.get("/next-id")
def next_patient_id(
    db: Session = Depends(get_db),
    _: User = Depends(_clinical),
):
    return {"patient_id": _next_patient_id(db)}


@router.post("", response_model=PatientOut, status_code=status.HTTP_201_CREATED)
def create_patient(
    body: PatientCreate,
    db: Session = Depends(get_db),
    _: User = Depends(_clinical),
):
    requested = (body.patient_id or "").strip()
    pid = requested or _next_patient_id(db)

    last_err: Exception | None = None
    for attempt in range(5):
        candidate = pid if attempt == 0 else _next_patient_id(db)
        if db.query(Patient).filter(Patient.patient_id == candidate).first():
            if attempt == 0 and requested:
                raise HTTPException(status_code=400, detail="patient_id already exists")
            continue
        data = body.model_dump()
        data["patient_id"] = candidate
        patient = Patient(**data)
        db.add(patient)
        try:
            db.commit()
            db.refresh(patient)
            return patient
        except IntegrityError as e:
            last_err = e
            db.rollback()
            if requested and attempt == 0:
                raise HTTPException(status_code=400, detail="patient_id already exists") from e
    raise HTTPException(
        status_code=409,
        detail=f"Could not allocate unique patient_id: {last_err}",
    )


@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(_clinical),
):
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.patch("/{patient_id}", response_model=PatientOut)
def update_patient(
    patient_id: str,
    body: PatientUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(_clinical),
):
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(patient, key, value)
    db.commit()
    db.refresh(patient)
    return patient
