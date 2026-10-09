from fastapi import APIRouter

from app.config import get_settings
from app.ml import cnn as cnn_mod
from app.ml import qml as qml_mod

router = APIRouter(tags=["health"])


def _torch_device() -> str:
    try:
        import torch

        if torch.cuda.is_available():
            return f"cuda ({torch.cuda.get_device_name(0)})"
        return "cpu"
    except Exception:  # noqa: BLE001
        return "cpu (torch unavailable)"


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
