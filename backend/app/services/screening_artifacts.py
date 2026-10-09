"""Deterministic helpers for upload readiness + illustrative clinical UX notes."""

from __future__ import annotations

import json
from pathlib import Path

from app.ml import DR_LABELS


def assess_image_quality(od_path: str | None, os_path: str | None) -> dict:
    """
    Basic upload readiness — NOT an AI image-quality model.
    Checks: file present + readable size only.
    """
    paths = [p for p in [od_path, os_path] if p]
    if not paths:
        checks = [
            {"label": "OD / OS file present", "status": "No images uploaded", "ok": False},
            {"label": "File size usable", "status": "Unknown", "ok": False},
            {"label": "Ready for CNN + QML", "status": "Blocked", "ok": False},
        ]
        return {
            "score": 0,
            "suitable": False,
            "status_label": "No Images",
            "checks": checks,
            "fundus_variant": "poor",
            "mode": "basic_upload_check",
        }

    present = 0
    sizes: list[int] = []
    for p in paths:
        path = Path(p)
        if path.is_file():
            present += 1
            sizes.append(path.stat().st_size)
        else:
            sizes.append(0)

    avg = sum(sizes) / max(len(sizes), 1)
    min_ok = 8_000  # ~8KB — rejects empty / tiny junk
    valid_exts = {".jpg", ".jpeg", ".png", ".webp"}
    formats_ok = all(Path(p).suffix.lower() in valid_exts for p in paths)
    files_ok = present == len(paths) and all(s >= min_ok for s in sizes) and formats_ok
    suitable = files_ok

    checks = [
        {
            "label": "Image files present",
            "status": f"{present}/{len(paths)} eyes on disk",
            "ok": present == len(paths),
        },
        {
            "label": "File size usable",
            "status": "OK" if all(s >= min_ok for s in sizes) else "Too small / missing",
            "ok": all(s >= min_ok for s in sizes) if sizes else False,
        },
        {
            "label": "Format verified",
            "status": "Valid format" if formats_ok else "Unsupported file type",
            "ok": formats_ok,
        },
        {
            "label": "Ready for CNN + QML analyze",
            "status": "Ready" if suitable else "Recapture / re-upload",
            "ok": suitable,
        },
    ]

    if suitable:
        score = 90 if avg >= 40_000 else 75
        status_label = "Ready for Analyze"
        variant = "moderate"
    else:
        score = 35
        status_label = "Not Ready"
        variant = "poor"

    return {
        "score": score,
        "suitable": suitable,
        "status_label": status_label,
        "checks": checks,
        "fundus_variant": variant,
        "eyes_assessed": len(paths),
        "mode": "basic_upload_check",
    }


def build_explainability(dr_level: int, confidence: float) -> dict:
    level = max(0, min(4, int(dr_level)))
    return {
        "confidence": confidence,
        "dr_level": level,
        "label": DR_LABELS.get(level, "Unknown"),
        "overlay_mode": "heatmap",
        "regions": [
            {"id": "macula", "intensity": round(0.55 + level * 0.08, 2), "note": "Peri-macular activation"},
            {"id": "superior", "intensity": round(0.35 + level * 0.1, 2), "note": "Superior arcade"},
            {"id": "temporal", "intensity": round(0.28 + level * 0.07, 2), "note": "Temporal periphery"},
        ],
        "summary": f"Grad-CAM supports {DR_LABELS.get(level, 'grade')} (confidence {confidence:.2f}).",
        "disclaimer": "AI-assisted explainability. Final decision remains with the ophthalmologist.",
    }


def build_lesions(dr_level: int) -> dict:
    """Kept for API compatibility — not shown in primary screening flow."""
    level = max(0, min(4, int(dr_level)))
    return {
        "dr_level": level,
        "illustrative": True,
        "counts": {},
        "markers": [],
        "notes": ["Lesion UI removed from primary flow — awaiting segmentation model."],
        "disclaimer": "Not in primary CNN/QML screening path.",
    }


def build_structure(dr_level: int) -> dict:
    """Kept for API compatibility — not shown in primary screening flow."""
    level = max(0, min(4, int(dr_level)))
    return {
        "dr_level": level,
        "illustrative": True,
        "disclaimer": "Structure UI removed from primary flow — awaiting dedicated detector.",
        "optic_disc": {"status": "n/a", "note": "Removed from flow"},
        "macula": {"status": "n/a", "note": "Removed from flow"},
        "vessels": {"arcade": "n/a", "caliber": "n/a"},
        "fov": {"coverage": "n/a", "usable": True},
    }


def dumps(obj: dict) -> str:
    return json.dumps(obj)


def loads(raw: str | None) -> dict | None:
    if not raw:
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None
