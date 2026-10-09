import json

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_roles
from app.models import AnalyticsSnapshot, Device, User
from app.roles import ROLE_ADMIN, ROLE_OPERATOR, ROLE_OPHTHALMOLOGIST, ROLE_REVIEWER
from app.schemas import OpsStatusOut, OpsSystemOut
from app.services.defaults import get_snapshot_default

router = APIRouter(prefix="/ops", tags=["operations"])

_roles = require_roles(ROLE_ADMIN, ROLE_OPERATOR, ROLE_OPHTHALMOLOGIST, ROLE_REVIEWER)


@router.get("/status", response_model=OpsStatusOut)
def ops_status(
    db: Session = Depends(get_db),
    _: User = Depends(_roles),
):
    row = (
        db.query(AnalyticsSnapshot)
        .filter(AnalyticsSnapshot.key == "system_operations")
        .first()
    )
    if row:
        snap = json.loads(row.payload)
    else:
        snap = get_snapshot_default("system_operations") or {"banner": "", "systems": []}

    devices = db.query(Device).all()
    total = len(devices)
    offline = sum(1 for d in devices if (d.status or "").lower() not in ("online", "ok"))

    systems: list[OpsSystemOut] = []
    for s in snap.get("systems", []):
        name = s["name"]
        status = s.get("status", "Operational")
        load = int(s.get("load", 0))
        color = s.get("color", "#64748B")
        updated = s.get("updated", "—")

        # Live overlay: Fundus Devices reflect offline / pending cameras
        if name == "Fundus Devices" and total:
            load = min(95, 40 + int(100 * offline / max(total, 1)))
            if offline:
                status = "Degraded"
                color = "#F57A0F"
                updated = f"{offline} of {total} not online"
            else:
                status = "Operational"
                color = "#1AA16B"
                updated = "All devices online"

        systems.append(
            OpsSystemOut(
                name=name,
                status=status,
                load=load,
                updated=updated,
                color=color,
            )
        )

    all_ok = all(s.status == "Operational" for s in systems)
    return OpsStatusOut(
        banner=snap.get("banner", ""),
        all_operational=all_ok,
        systems=systems,
        offline_devices=offline,
        total_devices=total,
    )
