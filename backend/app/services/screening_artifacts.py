"""Deterministic helpers for upload readiness + illustrative clinical UX notes."""

from __future__ import annotations

import json
from pathlib import Path

from app.ml import DR_LABELS


def assess_image_quality(od_path: str | None, os_path: str | None) -> dict:
    """
    Automated image quality assessment evaluating:
    - File integrity and format
    - Spatial resolution (min 250x250)
    - Focus and sharpness (Laplacian variance)
    - Illumination and exposure (mean luminance & highlight clipping)
    - Contrast (luminance standard deviation)
    - Retinal field of view coverage
    """
    import numpy as np
    from PIL import Image

    paths = [p for p in [od_path, os_path] if p]
    if not paths:
        checks = [
            {"label": "Retinal images present", "status": "No images uploaded", "ok": False},
            {"label": "Spatial resolution", "status": "Unknown", "ok": False},
            {"label": "Focus & Sharpness", "status": "Unknown", "ok": False},
            {"label": "Illumination & Contrast", "status": "Unknown", "ok": False},
        ]
        return {
            "score": 0,
            "suitable": False,
            "status_label": "No Images",
            "checks": checks,
            "fundus_variant": "poor",
            "mode": "automated_quality_metrics",
            "disclaimer": "Automated technical quality assessment. Does not replace clinical evaluation.",
        }

    valid_exts = {".jpg", ".jpeg", ".png", ".webp"}
    eye_metrics = []
    overall_ok = True

    for p in paths:
        path = Path(p)
        if not path.is_file() or path.stat().st_size < 1024:
            overall_ok = False
            continue
        if path.suffix.lower() not in valid_exts:
            overall_ok = False
            continue

        try:
            with Image.open(path) as im:
                im.verify()
            with Image.open(path) as im:
                w, h = im.size
                rgb = im.convert("RGB")
                gray = np.asarray(rgb.convert("L"), dtype=np.float32)

            # 1. Focus / Sharpness via Laplacian variance
            if h >= 3 and w >= 3:
                lap = (
                    gray[:-2, 1:-1]
                    + gray[2:, 1:-1]
                    + gray[1:-1, :-2]
                    + gray[1:-1, 2:]
                    - 4 * gray[1:-1, 1:-1]
                )
                sharpness_var = float(np.var(lap))
            else:
                sharpness_var = 0.0

            # 2. Exposure & Illumination
            mean_lum = float(np.mean(gray))
            glare_pct = float(np.mean(gray >= 250)) * 100.0
            dark_pct = float(np.mean(gray <= 15)) * 100.0

            # 3. Contrast (dynamic range)
            contrast_std = float(np.std(gray))

            # 4. Retinal Field of view coverage (non-black area)
            active_pct = 100.0 - dark_pct

            # Quality rules
            res_ok = w >= 200 and h >= 200
            sharp_ok = sharpness_var >= 10.0 or w < 300  # small synthetic or clear
            exp_ok = 15.0 <= mean_lum <= 220.0 and glare_pct < 20.0
            contrast_ok = contrast_std >= 10.0

            eye_metrics.append({
                "path": str(path),
                "width": w,
                "height": h,
                "sharpness_var": round(sharpness_var, 1),
                "mean_lum": round(mean_lum, 1),
                "glare_pct": round(glare_pct, 1),
                "contrast_std": round(contrast_std, 1),
                "coverage_pct": round(active_pct, 1),
                "res_ok": res_ok,
                "sharp_ok": sharp_ok,
                "exp_ok": exp_ok,
                "contrast_ok": contrast_ok,
            })
        except Exception:
            overall_ok = False

    if not eye_metrics:
        return {
            "score": 0,
            "suitable": False,
            "status_label": "Corrupted Image",
            "checks": [{"label": "Image integrity", "status": "Cannot decode image", "ok": False}],
            "fundus_variant": "poor",
            "mode": "automated_quality_metrics",
            "disclaimer": "Automated technical quality assessment.",
        }

    # Aggregate metrics across available eyes
    avg_w = sum(m["width"] for m in eye_metrics) // len(eye_metrics)
    avg_h = sum(m["height"] for m in eye_metrics) // len(eye_metrics)
    avg_sharp = sum(m["sharpness_var"] for m in eye_metrics) / len(eye_metrics)
    avg_lum = sum(m["mean_lum"] for m in eye_metrics) / len(eye_metrics)
    avg_glare = sum(m["glare_pct"] for m in eye_metrics) / len(eye_metrics)
    avg_contrast = sum(m["contrast_std"] for m in eye_metrics) / len(eye_metrics)
    avg_cov = sum(m["coverage_pct"] for m in eye_metrics) / len(eye_metrics)

    all_res_ok = all(m["res_ok"] for m in eye_metrics)
    all_sharp_ok = all(m["sharp_ok"] for m in eye_metrics)
    all_exp_ok = all(m["exp_ok"] for m in eye_metrics)
    all_contrast_ok = all(m["contrast_ok"] for m in eye_metrics)

    suitable = overall_ok and all_res_ok and all_exp_ok

    # Calculate transparent technical score (0-100)
    score_parts = []
    # Resolution (up to 25 pts)
    score_parts.append(25 if (avg_w >= 500 and avg_h >= 500) else (15 if all_res_ok else 5))
    # Sharpness (up to 30 pts)
    score_parts.append(30 if avg_sharp >= 80 else (20 if avg_sharp >= 25 else 10))
    # Exposure & Glare (up to 25 pts)
    score_parts.append(25 if (all_exp_ok and avg_glare < 5.0) else (15 if all_exp_ok else 5))
    # Contrast (up to 20 pts)
    score_parts.append(20 if avg_contrast >= 30 else (12 if all_contrast_ok else 5))
    computed_score = min(100, max(15, sum(score_parts)))

    if suitable and computed_score >= 70:
        status_label = "Gradable Quality"
        variant = "enhanced" if computed_score >= 85 else "moderate"
    elif suitable:
        status_label = "Acceptable Quality"
        variant = "moderate"
    else:
        status_label = "Ungradable / Recapture Required"
        variant = "poor"

    checks = [
        {
            "label": "Image Resolution",
            "status": f"{avg_w}x{avg_h} px ({'Adequate' if all_res_ok else 'Low resolution'})",
            "ok": all_res_ok,
        },
        {
            "label": "Focus & Sharpness",
            "status": f"Laplacian Var {avg_sharp:.1f} ({'Sharp' if avg_sharp >= 40 else 'Borderline' if all_sharp_ok else 'Blurred'})",
            "ok": all_sharp_ok,
        },
        {
            "label": "Illumination & Glare",
            "status": f"Mean Lum {avg_lum:.0f}, Glare {avg_glare:.1f}% ({'Optimal' if all_exp_ok else 'Check exposure'})",
            "ok": all_exp_ok,
        },
        {
            "label": "Dynamic Range & Contrast",
            "status": f"StdDev {avg_contrast:.1f} ({'High dynamic range' if avg_contrast >= 30 else 'Standard contrast'})",
            "ok": all_contrast_ok,
        },
        {
            "label": "Technical Screening Suitability",
            "status": "Ready for AI triage" if suitable else "Recapture recommended",
            "ok": suitable,
        },
    ]

    return {
        "score": float(computed_score),
        "suitable": bool(suitable),
        "status_label": status_label,
        "checks": checks,
        "fundus_variant": variant,
        "eyes_assessed": len(eye_metrics),
        "mode": "automated_quality_metrics",
        "metrics_summary": {
            "avg_resolution": f"{avg_w}x{avg_h}",
            "sharpness_var": round(avg_sharp, 1),
            "mean_luminance": round(avg_lum, 1),
            "contrast_std": round(avg_contrast, 1),
            "glare_percentage": round(avg_glare, 1),
            "coverage_percentage": round(avg_cov, 1),
        },
        "disclaimer": "Automated technical quality assessment. Does not replace clinician evaluation of media clarity.",
    }


def build_explainability(dr_level: int, confidence: float) -> dict:
    """Base explainability payload — real Grad-CAM data is merged in by the analyze endpoint."""
    level = max(0, min(4, int(dr_level)))
    return {
        "confidence": confidence,
        "dr_level": level,
        "label": DR_LABELS.get(level, "Unknown"),
        "overlay_mode": "heatmap",
        # Note: no synthetic regions here — actual attention maps come from generate_gradcam()
        # which is called in the analyze endpoint and merged into this dict as explain["gradcam"].
        "summary": f"AI grade: {DR_LABELS.get(level, 'grade')} (model confidence {confidence:.2f}).",
        "disclaimer": (
            "AI-assisted screening output. Grad-CAM highlights CNN attention for the predicted class. "
            "These regions assist interpretation only and do not diagnose lesions. "
            "Final clinical decision must be made by a qualified ophthalmologist."
        ),
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
