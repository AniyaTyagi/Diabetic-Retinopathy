import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_roles
from app.models import AnalyticsSnapshot, User
from app.roles import ROLE_ADMIN, ROLE_OPERATOR, ROLE_OPHTHALMOLOGIST, ROLE_REVIEWER
from app.schemas import (
    BottleneckOut,
    CapacityMetricOut,
    PipelineNodeOut,
    SimulationCapacityOut,
    SimulationDefaultsOut,
    SimulationDefaultsUpdate,
)
from app.services.defaults import get_snapshot_default

router = APIRouter(prefix="/simulation", tags=["simulation"])

_roles = require_roles(ROLE_ADMIN, ROLE_OPERATOR, ROLE_OPHTHALMOLOGIST, ROLE_REVIEWER)


def _snapshot(db: Session, key: str) -> dict:
    row = db.query(AnalyticsSnapshot).filter(AnalyticsSnapshot.key == key).first()
    if row:
        return json.loads(row.payload)
    fallback = get_snapshot_default(key)
    if fallback:
        return dict(fallback)
    raise HTTPException(status_code=404, detail=f"Snapshot '{key}' not available")


def _save_snapshot(db: Session, key: str, payload: dict) -> None:
    row = db.query(AnalyticsSnapshot).filter(AnalyticsSnapshot.key == key).first()
    blob = json.dumps(payload)
    if row:
        row.payload = blob
    else:
        db.add(AnalyticsSnapshot(key=key, payload=blob))
    db.commit()


@router.get("/capacity", response_model=SimulationCapacityOut)
def simulation_capacity(
    db: Session = Depends(get_db),
    _: User = Depends(_roles),
):
    snap = _snapshot(db, "simulation_capacity")
    return SimulationCapacityOut(
        title=snap.get("title", "District Capacity"),
        subtitle=snap.get("subtitle", ""),
        pipeline=[
            PipelineNodeOut(label=n["label"], accent=n.get("accent", "#64748B"))
            for n in snap.get("pipeline", [])
        ],
        metrics=[
            CapacityMetricOut(
                label=m["label"], value=m["value"], color=m.get("color", "#121C2E")
            )
            for m in snap.get("metrics", [])
        ],
        bottlenecks=[
            BottleneckOut(
                label=b["label"],
                detail=b["detail"],
                severity=b["severity"],
                color=b.get("color", "#64748B"),
            )
            for b in snap.get("bottlenecks", [])
        ],
    )


@router.get("/defaults", response_model=SimulationDefaultsOut)
def simulation_defaults(
    db: Session = Depends(get_db),
    _: User = Depends(_roles),
):
    snap = _snapshot(db, "simulation_defaults")
    return SimulationDefaultsOut(
        phcs=int(snap.get("phcs", 12)),
        images_day=int(snap.get("images_day", 320)),
        bandwidth=int(snap.get("bandwidth", 68)),
        ophthalmologists=int(snap.get("ophthalmologists", 4)),
        ai_capacity_per_hour=int(snap.get("ai_capacity_per_hour", 180)),
    )


@router.patch("/defaults", response_model=SimulationDefaultsOut)
def update_simulation_defaults(
    body: SimulationDefaultsUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(ROLE_ADMIN, ROLE_OPERATOR)),
):
    snap = _snapshot(db, "simulation_defaults")
    data = body.model_dump(exclude_unset=True)
    snap.update({k: v for k, v in data.items() if v is not None})
    _save_snapshot(db, "simulation_defaults", snap)
    return SimulationDefaultsOut(
        phcs=int(snap["phcs"]),
        images_day=int(snap["images_day"]),
        bandwidth=int(snap["bandwidth"]),
        ophthalmologists=int(snap["ophthalmologists"]),
        ai_capacity_per_hour=int(snap["ai_capacity_per_hour"]),
    )
