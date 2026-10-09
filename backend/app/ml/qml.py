"""Hybrid QML inference — notebook pipeline, weights read-only.

Pipeline: DINOv2 1536-d features → PCA(4) → StandardScaler → PennyLane HybridQML → 5-class DR.
"""

from __future__ import annotations

import io
import os
import threading
import zipfile
from pathlib import Path

import numpy as np
from PIL import Image

WEIGHTS_DIR = Path(__file__).resolve().parent / "weights"
QMODEL_DIR = WEIGHTS_DIR / "qmodel"
PCA_PATH = WEIGHTS_DIR / "pca.pkl"
SCALER_PATH = WEIGHTS_DIR / "scaler.pkl"

N_QUBITS = 4
N_LAYERS = 2
N_CLASSES = 5
FEAT_DIM = 1536

_lock = threading.Lock()
_pca = None
_scaler = None
_qmodel = None
_device = None


def qml_enabled() -> bool:
    flag = os.getenv("NETRAX_QML_ENABLED", "1").strip().lower()
    if flag in {"0", "false", "no", "off"}:
        return False
    return (
        QMODEL_DIR.is_dir()
        and PCA_PATH.is_file()
        and SCALER_PATH.is_file()
        and (QMODEL_DIR / "data.pkl").is_file()
    )


def qml_weights_dir() -> Path:
    return WEIGHTS_DIR


def _get_device():
    import torch

    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")


def _load_state_dict_from_qmodel_dir(path: Path) -> dict:
    """Reconstitute extracted torch.save folder as an in-memory zip archive."""
    import torch

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        for p in path.rglob("*"):
            if p.is_file():
                rel = p.relative_to(path).as_posix()
                zf.write(p, arcname=f"archive/{rel}")
    buf.seek(0)
    obj = torch.load(buf, map_location="cpu", weights_only=False)
    if not isinstance(obj, dict):
        raise TypeError(f"Expected state_dict dict from qmodel, got {type(obj)}")
    return obj


def _build_hybrid_qml():
    import pennylane as qml
    import torch.nn as nn

    dev = qml.device("default.qubit", wires=N_QUBITS)

    @qml.qnode(dev, interface="torch")
    def circuit(inputs, weights):
        qml.AngleEmbedding(inputs, wires=range(N_QUBITS))
        qml.BasicEntanglerLayers(weights, wires=range(N_QUBITS))
        return [qml.expval(qml.PauliZ(w)) for w in range(N_QUBITS)]

    class HybridQML(nn.Module):
        def __init__(self) -> None:
            super().__init__()
            self.q = qml.qnn.TorchLayer(circuit, {"weights": (N_LAYERS, N_QUBITS)})
            self.head = nn.Linear(N_QUBITS, N_CLASSES)

        def forward(self, x):  # noqa: ANN001
            return self.head(self.q(x))

    return HybridQML()


def _load():
    global _pca, _scaler, _qmodel, _device
    if _qmodel is not None:
        return

    with _lock:
        if _qmodel is not None:
            return

        import joblib
        import torch

        if not qml_enabled():
            raise FileNotFoundError(
                f"QML artifacts missing or disabled under {WEIGHTS_DIR}"
            )

        _device = _get_device()
        _pca = joblib.load(PCA_PATH)
        _scaler = joblib.load(SCALER_PATH)
        state = _load_state_dict_from_qmodel_dir(QMODEL_DIR)
        model = _build_hybrid_qml()
        model.load_state_dict(state)
        model.to(_device)
        model.eval()
        _qmodel = model


def extract_dino_features_518(image_path: str) -> np.ndarray:
    """
    Notebook Cell 7: Resize 518, ImageNet norm, CLS + patch-mean → (1536,).
    Uses the same fine-tuned DINOv2 weights as CNN (read-only HF folder).
    """
    import torch
    import torchvision.transforms as T

    from app.ml import cnn as cnn_mod

    cnn_mod._load()  # noqa: SLF001 — shared singleton backbone
    backbone_model = cnn_mod._model  # noqa: SLF001
    device = cnn_mod._device  # noqa: SLF001
    assert backbone_model is not None and device is not None

    tf = T.Compose(
        [
            T.Resize((518, 518)),
            T.ToTensor(),
            T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ]
    )
    batch = tf(Image.open(image_path).convert("RGB")).unsqueeze(0).to(device)
    with torch.no_grad():
        seq = backbone_model.dinov2(batch).last_hidden_state
        cls = seq[:, 0]
        patch_mean = seq[:, 1:].mean(1)
        feat = torch.cat([cls, patch_mean], dim=1).cpu().numpy()[0]
    if feat.shape[0] != FEAT_DIM:
        raise RuntimeError(f"Expected {FEAT_DIM}-d features, got {feat.shape}")
    return feat.astype(np.float64)


def predict_image(image_path: str) -> dict:
    import torch

    _load()
    assert _pca is not None and _scaler is not None and _qmodel is not None and _device is not None

    feat = extract_dino_features_518(image_path)
    q = _scaler.transform(_pca.transform(feat.reshape(1, -1)))
    x = torch.tensor(q, dtype=torch.float32, device=_device)
    with torch.no_grad():
        logits = _qmodel(x)[0]
        probabilities = torch.softmax(logits, dim=-1)

    predicted_class = int(probabilities.argmax(dim=-1).item())
    confidence = float(probabilities[predicted_class].item())
    probs = {str(i): float(probabilities[i].item()) for i in range(N_CLASSES)}

    return {
        "dr_level": predicted_class,
        "confidence": confidence,
        "probabilities": probs,
        "image_path": image_path,
        "feature_dim": FEAT_DIM,
        "qubits": N_QUBITS,
    }


def predict_eyes(image_paths: list[str]) -> dict:
    if not image_paths:
        raise ValueError("No image paths provided for QML inference")

    per_eye: list[dict] = []
    for path in image_paths:
        if not path or not Path(path).is_file():
            raise FileNotFoundError(f"Image not found: {path}")
        per_eye.append(predict_image(path))

    worst = max(per_eye, key=lambda r: (r["dr_level"], r["confidence"]))
    return {
        "dr_level": worst["dr_level"],
        "confidence": worst["confidence"],
        "probabilities": worst["probabilities"],
        "per_eye": per_eye,
        "eyes_scored": len(per_eye),
        "qubits": N_QUBITS,
    }
