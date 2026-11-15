import shutil
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.ml import cnn as cnn_mod
from app.ml import qml as qml_mod

router = APIRouter(tags=["health"])

UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"


def _torch_device() -> str:
    try:
        import torch

        if torch.cuda.is_available():
            return f"cuda ({torch.cuda.get_device_name(0)})"
        return "cpu"
    except Exception:  # noqa: BLE001
        return "cpu (torch unavailable)"


def _disk_usage(path: Path) -> dict:
    """Return GB used/total for the volume containing *path*."""
    try:
        usage = shutil.disk_usage(path)
        return {
            "used_gb": round(usage.used / 1e9, 2),
            "free_gb": round(usage.free / 1e9, 2),
            "total_gb": round(usage.total / 1e9, 2),
        }
    except Exception:  # noqa: BLE001
        return {"used_gb": None, "free_gb": None, "total_gb": None}


@router.get("/health")
def health():
    settings = get_settings()
    return {
        "status": "ok",
        "app": settings.app_name,
        "env": settings.app_env,
        "ml": {
            "cnn": "live" if cnn_mod.cnn_enabled() else "disabled",
            "qml": "live" if qml_mod.qml_enabled() else "disabled",
            "device": _torch_device(),
            "note": "DINOv2 CNN + Hybrid QML ensemble; Grad-CAM from CNN",
        },
    }


@router.get("/health/detailed")
def health_detailed(db: Session = Depends(get_db)):
    """Extended health check: DB ping, ML weight status, disk usage, model version."""
    settings = get_settings()

    # Database ping
    db_ok = False
    db_error: str | None = None
    try:
        db.execute(__import__("sqlalchemy").text("SELECT 1"))
        db_ok = True
    except Exception as exc:  # noqa: BLE001
        db_error = str(exc)

    # Upload dir stats
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    upload_file_count = sum(1 for _ in UPLOAD_DIR.rglob("*") if _.is_file())
    disk = _disk_usage(UPLOAD_DIR)

    # ML readiness
    cnn_ready = cnn_mod.cnn_enabled()
    qml_ready = qml_mod.qml_enabled()

    # Model version from config.json if present
    model_version: str | None = None
    cfg_path = Path(__file__).resolve().parents[1] / "models" / "weights" / "config.json"
    if cfg_path.is_file():
        try:
            import json
            cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
            model_version = cfg.get("_name_or_path") or cfg.get("model_type") or "unknown"
        except Exception:  # noqa: BLE001
            model_version = "config_parse_error"

    overall = "ok" if db_ok else "degraded"

    return {
        "status": overall,
        "timestamp": datetime.now(tz=timezone.utc).isoformat(),
        "app": settings.app_name,
        "env": settings.app_env,
        "database": {
            "ok": db_ok,
            "error": db_error,
        },
        "ml": {
            "cnn": "live" if cnn_ready else "disabled (weights missing)",
            "qml": "live" if qml_ready else "disabled (artifacts missing)",
            "device": _torch_device(),
            "model_version": model_version,
        },
        "uploads": {
            "file_count": upload_file_count,
            **disk,
        },
    }
