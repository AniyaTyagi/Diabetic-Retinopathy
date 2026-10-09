from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_roles
from app.models import Center, User
from app.roles import ROLE_ADMIN
from app.schemas import CenterCreate, CenterOut, CenterUpdate

router = APIRouter(prefix="/centers", tags=["centers"])


@router.get("", response_model=list[CenterOut])
def list_centers(db: Session = Depends(get_db)):
    """Public read — used by login/register center picker before auth."""
    return db.query(Center).order_by(Center.id.asc()).all()


@router.post("", response_model=CenterOut, status_code=status.HTTP_201_CREATED)
def create_center(
    body: CenterCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(ROLE_ADMIN)),
):
    if db.query(Center).filter(Center.name == body.name).first():
        raise HTTPException(status_code=400, detail="Center name already exists")
    row = Center(**body.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.patch("/{center_id}", response_model=CenterOut)
def update_center(
    center_id: int,
    body: CenterUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(ROLE_ADMIN)),
):
    row = db.query(Center).filter(Center.id == center_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Center not found")
    data = body.model_dump(exclude_unset=True)
    if "name" in data and data["name"]:
        clash = (
            db.query(Center)
            .filter(Center.name == data["name"], Center.id != center_id)
            .first()
        )
        if clash:
            raise HTTPException(status_code=400, detail="Center name already exists")
    for k, v in data.items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return row
