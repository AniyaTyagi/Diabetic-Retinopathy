"""DINOv2 CNN inference — loads HuggingFace folder read-only (no weight mutation)."""

from __future__ import annotations

import os
import threading
from pathlib import Path

from PIL import Image

# Weights shipped by the team — never write to this directory.
CNN_MODEL_DIR = Path(__file__).resolve().parent / "weights" / "CNN"

_lock = threading.Lock()
_processor = None
_model = None
_device = None


def cnn_enabled() -> bool:
    flag = os.getenv("NETRAX_CNN_ENABLED", "1").strip().lower()
    if flag in {"0", "false", "no", "off"}:
        return False
    return CNN_MODEL_DIR.is_dir() and (CNN_MODEL_DIR / "config.json").is_file()


def cnn_model_dir() -> Path:
    return CNN_MODEL_DIR


def _get_device():
    import torch

    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")


def _load():
    global _processor, _model, _device
    if _model is not None:
        return

    with _lock:
        if _model is not None:
            return

        import torch
        from transformers import AutoImageProcessor, AutoModelForImageClassification

        if not cnn_enabled():
            raise FileNotFoundError(
                f"CNN model folder missing or disabled. Expected: {CNN_MODEL_DIR}"
            )

        _device = _get_device()
        _processor = AutoImageProcessor.from_pretrained(
            str(CNN_MODEL_DIR),
            local_files_only=True,
        )
        _model = AutoModelForImageClassification.from_pretrained(
            str(CNN_MODEL_DIR),
            local_files_only=True,
        )
        _model.to(_device)
        _model.eval()


def predict_image(image_path: str) -> dict:
    """
    Run CNN on one fundus image path.
    Same flow as team test_model.py (processor → model → softmax).
    """
    import torch

    _load()
    assert _processor is not None and _model is not None and _device is not None

    image = Image.open(image_path).convert("RGB")
    inputs = _processor(images=image, return_tensors="pt")
    inputs = {k: v.to(_device) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = _model(**inputs)

    probabilities = torch.softmax(outputs.logits, dim=-1)[0]
    predicted_class = int(probabilities.argmax(dim=-1).item())
    confidence = float(probabilities[predicted_class].item())

    id2label = _model.config.id2label or {}
    raw_label = id2label.get(predicted_class, id2label.get(str(predicted_class), str(predicted_class)))

    probs = {
        str(i): float(probabilities[i].item())
        for i in range(probabilities.shape[0])
    }

    return {
        "dr_level": predicted_class,
        "confidence": confidence,
        "raw_label": str(raw_label),
        "probabilities": probs,
        "image_path": image_path,
    }


def predict_eyes(image_paths: list[str]) -> dict:
    """
    Predict each eye; clinical triage uses worst (max) DR level.
    """
    if not image_paths:
        raise ValueError("No image paths provided for CNN inference")

    per_eye: list[dict] = []
    for path in image_paths:
        if not path or not Path(path).is_file():
            raise FileNotFoundError(f"Image not found: {path}")
        per_eye.append(predict_image(path))

    worst = max(per_eye, key=lambda r: (r["dr_level"], r["confidence"]))
    return {
        "dr_level": worst["dr_level"],
        "confidence": worst["confidence"],
        "raw_label": worst["raw_label"],
        "probabilities": worst["probabilities"],
        "per_eye": per_eye,
        "eyes_scored": len(per_eye),
    }
