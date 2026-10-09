"""Grad-CAM + image helpers for DINOv2 CNN (read-only weights)."""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image


def generate_gradcam(image_path: str, out_dir: Path, stem: str = "od") -> dict:
    """
    Grad-CAM on DINOv2 patch tokens for the predicted class.
    Saves heatmap + overlay PNGs under out_dir. Does not modify model weights.
    """
    import torch
    import torch.nn.functional as F

    from app.ml import cnn as cnn_mod

    cnn_mod._load()  # noqa: SLF001
    model = cnn_mod._model  # noqa: SLF001
    processor = cnn_mod._processor  # noqa: SLF001
    device = cnn_mod._device  # noqa: SLF001
    assert model is not None and processor is not None and device is not None

    out_dir.mkdir(parents=True, exist_ok=True)
    original = Image.open(image_path).convert("RGB")
    inputs = processor(images=original, return_tensors="pt")
    pixel_values = inputs["pixel_values"].to(device)
    pixel_values.requires_grad_(False)

    model.zero_grad(set_to_none=True)
    with torch.enable_grad():
        backbone_out = model.dinov2(pixel_values, output_hidden_states=False)
        hidden = backbone_out.last_hidden_state  # [1, 1+N, C]
        hidden.retain_grad()
        cls_token = hidden[:, 0]
        patch_tokens = hidden[:, 1:]
        # Match Dinov2ForImageClassification: concat CLS + patch mean → 1536
        linear_input = torch.cat([cls_token, patch_tokens.mean(dim=1)], dim=1)
        logits = model.classifier(linear_input)

        pred = int(logits.argmax(dim=-1).item())
        logits[0, pred].backward()

    grads = hidden.grad[0, 1:]  # patches
    acts = hidden.detach()[0, 1:]
    weights = grads.relu().mean(dim=1)  # [N]
    cam = (weights.unsqueeze(-1) * acts).sum(dim=-1)  # [N]
    cam = cam.relu()
    if float(cam.max()) > 0:
        cam = cam / cam.max()

    n = cam.shape[0]
    side = int(np.sqrt(n))
    if side * side != n:
        # pad to next square
        side = int(np.ceil(np.sqrt(n)))
        pad = side * side - n
        cam = F.pad(cam, (0, pad))
    cam_map = cam[: side * side].reshape(side, side).cpu().numpy()

    # Upsample CAM to original image size
    cam_img = Image.fromarray((cam_map * 255).astype(np.uint8), mode="L").resize(
        original.size, resample=Image.BICUBIC
    )
    cam_arr = np.asarray(cam_img).astype(np.float32) / 255.0

    # Jet-like heatmap RGB
    heatmap = _jet_colormap(cam_arr)
    heatmap_img = Image.fromarray(heatmap, mode="RGB")

    base = np.asarray(original).astype(np.float32)
    overlay = (0.45 * heatmap.astype(np.float32) + 0.55 * base).clip(0, 255).astype(np.uint8)
    overlay_img = Image.fromarray(overlay, mode="RGB")

    heatmap_path = out_dir / f"gradcam_{stem}_heatmap.png"
    overlay_path = out_dir / f"gradcam_{stem}_overlay.png"
    heatmap_img.save(heatmap_path)
    overlay_img.save(overlay_path)

    return {
        "eye": stem,
        "predicted_class": pred,
        "heatmap_path": str(heatmap_path),
        "overlay_path": str(overlay_path),
        "grid": side,
    }


def _jet_colormap(gray: np.ndarray) -> np.ndarray:
    """Simple jet colormap without matplotlib dependency."""
    x = np.clip(gray, 0, 1)
    r = np.clip(1.5 - np.abs(4 * x - 3), 0, 1)
    g = np.clip(1.5 - np.abs(4 * x - 2), 0, 1)
    b = np.clip(1.5 - np.abs(4 * x - 1), 0, 1)
    rgb = np.stack([r, g, b], axis=-1)
    return (rgb * 255).astype(np.uint8)
