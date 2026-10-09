import json

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_roles
from app.models import AppSetting, User
from app.roles import ROLE_ADMIN, ROLE_OPERATOR, ROLE_OPHTHALMOLOGIST, ROLE_REVIEWER
from app.schemas import (
    NotificationPrefsOut,
    PlatformSettingsOut,
    PlatformSettingsUpdate,
)
from app.services.defaults import APP_SETTINGS_DEFAULT

router = APIRouter(prefix="/settings", tags=["settings"])

_roles = require_roles(ROLE_ADMIN, ROLE_OPERATOR, ROLE_OPHTHALMOLOGIST, ROLE_REVIEWER)
PLATFORM_KEY = "platform"


def _load_platform(db: Session) -> dict:
    row = db.query(AppSetting).filter(AppSetting.key == PLATFORM_KEY).first()
    if row:
        return json.loads(row.value)
    return dict(APP_SETTINGS_DEFAULT)


def _save_platform(db: Session, value: dict) -> None:
    row = db.query(AppSetting).filter(AppSetting.key == PLATFORM_KEY).first()
    blob = json.dumps(value)
    if row:
        row.value = blob
    else:
        db.add(AppSetting(key=PLATFORM_KEY, value=blob))
    db.commit()


def _to_out(data: dict, user: User) -> PlatformSettingsOut:
    prefs = data.get("notification_prefs") or {}
    return PlatformSettingsOut(
        sections=list(data.get("sections", [])),
        inference_model=data.get(
            "inference_model", "Variational Quantum Classifier (VQC-ResNet)"
        ),
        referral_threshold=data.get(
            "referral_threshold",
            "Level 2+ (Moderate NPDR and above) — Recommended",
        ),
        explainability_enabled=bool(data.get("explainability_enabled", True)),
        human_review_required=bool(data.get("human_review_required", True)),
        notification_prefs=NotificationPrefsOut(
            critical_alerts=bool(prefs.get("critical_alerts", True)),
            offline_sync=bool(prefs.get("offline_sync", True)),
            daily_digest=bool(prefs.get("daily_digest", True)),
        ),
        report_blurb=data.get("report_blurb", ""),
        security_blurb=data.get("security_blurb", ""),
        profile_name=user.full_name,
        profile_email=user.email,
        profile_role=user.role,
        profile_center=user.center,
    )


@router.get("", response_model=PlatformSettingsOut)
def get_settings(
    db: Session = Depends(get_db),
    user: User = Depends(_roles),
):
    return _to_out(_load_platform(db), user)


@router.patch("", response_model=PlatformSettingsOut)
def update_settings(
    body: PlatformSettingsUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(ROLE_ADMIN, ROLE_OPERATOR, ROLE_OPHTHALMOLOGIST)),
):
    data = _load_platform(db)
    patch = body.model_dump(exclude_unset=True)
    if "notification_prefs" in patch and patch["notification_prefs"] is not None:
        prefs = data.get("notification_prefs") or {}
        prefs.update(patch.pop("notification_prefs"))
        data["notification_prefs"] = prefs
    for k, v in patch.items():
        if v is not None:
            data[k] = v
    _save_platform(db, data)
    return _to_out(data, user)
