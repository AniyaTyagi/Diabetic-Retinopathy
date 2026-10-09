"""ML inference — CNN (DINOv2) + Hybrid QML live; ensemble uses both."""

from dataclasses import dataclass

from app.ml import cnn as cnn_mod
from app.ml import qml as qml_mod

DR_LABELS = {
    0: "No DR",
    1: "Mild NPDR",
    2: "Moderate NPDR",
    3: "Severe NPDR",
    4: "Proliferative DR",
}


@dataclass
class InferenceResult:
    dr_level: int
    confidence: float
    model_used: str
    referral_needed: bool
    details: dict


def run_cnn(image_paths: list[str] | None = None) -> InferenceResult:
    """Real DINOv2 classifier from weights/CNN (read-only)."""
    if not image_paths:
        return InferenceResult(
            dr_level=0,
            confidence=0.0,
            model_used="CNN-DINOv2",
            referral_needed=False,
            details={"error": "No images uploaded for CNN inference"},
        )

    if not cnn_mod.cnn_enabled():
        return InferenceResult(
            dr_level=2,
            confidence=0.91,
            model_used="CNN-stub",
            referral_needed=True,
            details={
                "note": "CNN disabled or model folder missing — stub result",
                "model_dir": str(cnn_mod.cnn_model_dir()),
            },
        )

    pred = cnn_mod.predict_eyes(image_paths)
    level = int(pred["dr_level"])
    conf = float(pred["confidence"])
    return InferenceResult(
        dr_level=level,
        confidence=conf,
        model_used="CNN-DINOv2",
        referral_needed=level >= 2,
        details={
            "label": DR_LABELS.get(level, f"Class {level}"),
            "raw_label": pred.get("raw_label"),
            "probabilities": pred.get("probabilities"),
            "per_eye": pred.get("per_eye"),
            "eyes_scored": pred.get("eyes_scored"),
            "backbone": "facebook/dinov2-base",
        },
    )


def run_qml(image_paths: list[str] | None = None, features: dict | None = None) -> InferenceResult:
    """
    Hybrid QML (PennyLane) on DINOv2 1536-d features → PCA → scaler → VQC head.
    `features` kept for API compat; live path uses image_paths.
    """
    _ = features
    if not image_paths:
        return InferenceResult(
            dr_level=0,
            confidence=0.0,
            model_used="QML-Hybrid",
            referral_needed=False,
            details={"error": "No images uploaded for QML inference"},
        )

    if not qml_mod.qml_enabled():
        return InferenceResult(
            dr_level=2,
            confidence=0.93,
            model_used="QML-stub",
            referral_needed=True,
            details={"note": "QML disabled or artifacts missing — stub result"},
        )

    pred = qml_mod.predict_eyes(image_paths)
    level = int(pred["dr_level"])
    conf = float(pred["confidence"])
    return InferenceResult(
        dr_level=level,
        confidence=conf,
        model_used="QML-Hybrid",
        referral_needed=level >= 2,
        details={
            "label": DR_LABELS.get(level, f"Class {level}"),
            "probabilities": pred.get("probabilities"),
            "per_eye": pred.get("per_eye"),
            "eyes_scored": pred.get("eyes_scored"),
            "qubits": pred.get("qubits"),
            "pipeline": "DINOv2-1536 → PCA(4) → scaler → AngleEmbedding+BasicEntangler → Linear(5)",
        },
    )


def run_ensemble(image_paths: list[str] | None = None) -> InferenceResult:
    """
    Run CNN + QML. Final grade = model with higher confidence
    (ties → CNN). QML grade is always kept in details for UI suggestion.
    """
    cnn = run_cnn(image_paths)
    qml = run_qml(image_paths=image_paths)

    if qml.confidence > cnn.confidence:
        final_level, final_conf, winner = qml.dr_level, qml.confidence, "qml"
    else:
        final_level, final_conf, winner = cnn.dr_level, cnn.confidence, "cnn"

    live = cnn.model_used.startswith("CNN-DINOv2") and qml.model_used.startswith("QML-Hybrid")
    return InferenceResult(
        dr_level=final_level,
        confidence=final_conf,
        model_used="ensemble-CNN+QML" if live else "ensemble-partial",
        referral_needed=final_level >= 2,
        details={
            "label": DR_LABELS.get(final_level, f"Class {final_level}"),
            "note": "Ensemble = higher-confidence of live CNN and Hybrid QML",
            "winner": winner,
            "disagree": cnn.dr_level != qml.dr_level,
            "cnn": {
                "dr_level": cnn.dr_level,
                "confidence": cnn.confidence,
                "model_used": cnn.model_used,
                "label": DR_LABELS.get(cnn.dr_level, str(cnn.dr_level)),
                "probabilities": cnn.details.get("probabilities"),
                "per_eye": cnn.details.get("per_eye"),
            },
            "qml": {
                "dr_level": qml.dr_level,
                "confidence": qml.confidence,
                "model_used": qml.model_used,
                "label": DR_LABELS.get(qml.dr_level, str(qml.dr_level)),
                "probabilities": qml.details.get("probabilities"),
                "per_eye": qml.details.get("per_eye"),
                "qubits": qml.details.get("qubits"),
            },
            "per_eye": cnn.details.get("per_eye") or qml.details.get("per_eye"),
            "model_compare": {
                "cnn_dr_level": cnn.dr_level,
                "cnn_confidence": cnn.confidence,
                "cnn_label": DR_LABELS.get(cnn.dr_level, str(cnn.dr_level)),
                "qml_dr_level": qml.dr_level,
                "qml_confidence": qml.confidence,
                "qml_label": DR_LABELS.get(qml.dr_level, str(qml.dr_level)),
                "ensemble_dr_level": final_level,
                "ensemble_confidence": final_conf,
                "ensemble_label": DR_LABELS.get(final_level, str(final_level)),
                "winner": winner,
                "disagree": cnn.dr_level != qml.dr_level,
            },
        },
    )


# Back-compat alias
def run_mock_ensemble(image_paths: list[str] | None = None) -> InferenceResult:
    return run_ensemble(image_paths)


def analyze(model: str = "ensemble", image_paths: list[str] | None = None) -> InferenceResult:
    key = (model or "ensemble").lower()
    if key == "cnn":
        return run_cnn(image_paths)
    if key in {"qml", "vqc", "qsvm"}:
        return run_qml(image_paths=image_paths)
    if key in {"ensemble", "mock"}:
        return run_ensemble(image_paths)
    return run_ensemble(image_paths)
