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

    grads = hidden.grad[0, 1:]  # [N, C] patches
    acts = hidden.detach()[0, 1:]  # [N, C]
    # Standard Grad-CAM: one weight per channel (gradient averaged over patches),
    # then a weighted sum of channel activations at each patch.
    channel_weights = grads.mean(dim=0)  # [C]
    cam = (acts * channel_weights.unsqueeze(0)).sum(dim=-1)  # [N]
    positive = cam.relu()
    if float(positive.max()) > 0:
        cam = positive
    else:
        # No patch pushes the class up: fall back to relative evidence.
        cam = cam - cam.min()
    # Robust scaling so a few outlier patches do not wash out the map.
    lo = float(torch.quantile(cam, 0.40))
    hi = float(torch.quantile(cam, 0.99))
    if hi <= lo:
        lo, hi = float(cam.min()), float(cam.max())
    if hi > lo:
        cam = ((cam - lo) / (hi - lo)).clamp(0, 1)

    n = cam.shape[0]
    side = int(np.sqrt(n))
    if side * side != n:
        # pad to next square
        side = int(np.ceil(np.sqrt(n)))
        pad = side * side - n
        cam = F.pad(cam, (0, pad))
    cam_map = cam[: side * side].reshape(side, side).cpu().numpy()

    # The processor resizes the short edge then centre-crops, so the CAM covers
    # only that crop. Paste it back at the matching place in the original image.
    width, height = original.size
    box = _model_view_box(processor, width, height)
    box_w, box_h = box[2] - box[0], box[3] - box[1]
    cam_crop = Image.fromarray((cam_map * 255).astype(np.uint8), mode="L").resize(
        (box_w, box_h), resample=Image.BICUBIC
    )
    cam_img = Image.new("L", (width, height), 0)
    cam_img.paste(cam_crop, (box[0], box[1]))
    cam_arr = np.asarray(cam_img).astype(np.float32) / 255.0

    # Jet-like heatmap RGB
    heatmap = _jet_colormap(cam_arr)
    heatmap_img = Image.fromarray(heatmap, mode="RGB")

    base = np.asarray(original).astype(np.float32)
    # Blend by CAM strength so low-attention areas keep the original fundus.
    alpha = (0.6 * cam_arr)[..., None]
    overlay = (alpha * heatmap.astype(np.float32) + (1 - alpha) * base).clip(0, 255).astype(np.uint8)
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


def _model_view_box(processor, width: int, height: int) -> tuple[int, int, int, int]:
    """Region of the original image the model sees after resize + centre crop."""
    size = getattr(processor, "size", None) or {}
    crop = getattr(processor, "crop_size", None) or {}
    short = size.get("shortest_edge") if hasattr(size, "get") else None
    crop_h = crop.get("height") if hasattr(crop, "get") else None
    crop_w = crop.get("width") if hasattr(crop, "get") else None
    do_crop = bool(getattr(processor, "do_center_crop", False))
    if not (short and crop_h and crop_w and do_crop):
        return (0, 0, width, height)
    scale = short / min(width, height)
    box_w = max(1, min(width, int(round(crop_w / scale))))
    box_h = max(1, min(height, int(round(crop_h / scale))))
    left = (width - box_w) // 2
    top = (height - box_h) // 2
    return (left, top, left + box_w, top + box_h)


def _jet_colormap(gray: np.ndarray) -> np.ndarray:
    """Simple jet colormap without matplotlib dependency."""
    x = np.clip(gray, 0, 1)
    r = np.clip(1.5 - np.abs(4 * x - 3), 0, 1)
    g = np.clip(1.5 - np.abs(4 * x - 2), 0, 1)
    b = np.clip(1.5 - np.abs(4 * x - 1), 0, 1)
    rgb = np.stack([r, g, b], axis=-1)
    return (rgb * 255).astype(np.uint8)
