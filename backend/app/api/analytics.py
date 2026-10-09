import json
from collections import Counter

from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_roles
from app.models import AnalyticsSnapshot, Center, Device, ModelBenchmark, Screening, User
from app.roles import ROLE_ADMIN, ROLE_OPERATOR, ROLE_OPHTHALMOLOGIST, ROLE_REVIEWER
from app.schemas import (
    AnalyticsSummary,
    ModelBenchmarkOut,
    ModelPerformanceOut,
    QualityAnalyticsOut,
    QualityFailureOut,
)
from app.services.defaults import get_snapshot_default

router = APIRouter(prefix="/analytics", tags=["analytics"])

_roles = require_roles(ROLE_ADMIN, ROLE_OPERATOR, ROLE_OPHTHALMOLOGIST, ROLE_REVIEWER)
EVAL_METRICS_PATH = Path(__file__).resolve().parents[1] / "ml" / "eval_metrics.json"


def _load_eval_metrics() -> dict | None:
    if not EVAL_METRICS_PATH.is_file():
        return None
    try:
        return json.loads(EVAL_METRICS_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def _fmt(v: float | None, digits: int = 4) -> str:
    if v is None:
        return "—"
    return f"{float(v):.{digits}f}"


def _snapshot(db: Session, key: str) -> dict:
    row = db.query(AnalyticsSnapshot).filter(AnalyticsSnapshot.key == key).first()
    if row:
        return json.loads(row.payload)
    fallback = get_snapshot_default(key)
    if fallback:
        return fallback
    raise HTTPException(status_code=404, detail=f"Analytics snapshot '{key}' not available")


@router.get("/summary", response_model=AnalyticsSummary)
def summary(
    db: Session = Depends(get_db),
    _: User = Depends(_roles),
):
    all_rows = db.query(Screening).all()
    total = len(all_rows)
    referred = sum(
        1
        for s in all_rows
        if s.referral_needed or (s.dr_level is not None and s.dr_level >= 2)
    )
    pending = sum(1 for s in all_rows if s.review_status == "pending")
    ungradeable = sum(1 for s in all_rows if s.status == "ungradeable")
    levels = Counter(str(s.dr_level) for s in all_rows if s.dr_level is not None)
    confs = [s.confidence for s in all_rows if s.confidence is not None]
    avg_conf = round(sum(confs) / len(confs), 2) if confs else None

    return AnalyticsSummary(
        total_screenings=total,
        today_screenings=total,
        referred=referred,
        pending_review=pending,
        ungradeable=ungradeable,
        by_level=dict(levels),
        avg_confidence=avg_conf,
    )


@router.get("/models", response_model=ModelPerformanceOut)
def model_performance(
    db: Session = Depends(get_db),
    _: User = Depends(_roles),
):
    """Prefer app/ml/eval_metrics.json (team real eval). Fallback to snapshot only if missing."""
    live_levels = Counter(str(s.dr_level) for s in db.query(Screening).all() if s.dr_level is not None)
    eval_data = _load_eval_metrics()

    if eval_data:
        headline = eval_data.get("headline") or {}
        metrics = [
            {"l": "Accuracy", "v": _fmt(headline.get("accuracy"))},
            {"l": "Macro-F1", "v": _fmt(headline.get("f1"))},
            {"l": "Q. Kappa", "v": _fmt(headline.get("quadratic_kappa"))},
            {"l": "Sensitivity", "v": _fmt(headline.get("sensitivity"))},
            {"l": "Specificity", "v": _fmt(headline.get("specificity"))},
            {"l": "ROC-AUC", "v": _fmt(headline.get("roc_auc"))},
        ]
        models = [
            ModelBenchmarkOut(
                name=str(m.get("name", "Model")),
                accuracy=m.get("accuracy"),
                f1=m.get("f1"),
                quadratic_kappa=m.get("quadratic_kappa"),
                sensitivity=m.get("sensitivity"),
                specificity=m.get("specificity"),
                roc_auc=m.get("roc_auc"),
                pr_auc=m.get("pr_auc"),
                calibration=m.get("calibration"),
                is_headline=bool(m.get("is_headline", False)),
            )
            for m in (eval_data.get("models") or [])
        ]
        return ModelPerformanceOut(
            dataset=str(eval_data.get("dataset", "Team eval")),
            threshold_label=str(eval_data.get("threshold_label", "Referable = Level 2+")),
            headline_metrics=metrics,
            models=models,
            roc_points=str(eval_data.get("roc_points") or ""),
            pr_points=str(eval_data.get("pr_points") or ""),
            confusion=eval_data.get("confusion") or {"tn": 0, "fp": 0, "fn": 0, "tp": 0},
            class_distribution=eval_data.get("class_distribution") or [0, 0, 0, 0, 0],
            live_by_level=dict(live_levels),
            status=str(eval_data.get("status") or "ok"),
            note=eval_data.get("note"),
            source=eval_data.get("source"),
        )

    # Legacy fallback
    snap = _snapshot(db, "model_performance")
    rows = db.query(ModelBenchmark).order_by(ModelBenchmark.id.asc()).all()
    headline_row = next((r for r in rows if r.is_headline), rows[0] if rows else None)
    if headline_row:
        metrics = [
            {"l": "Sensitivity", "v": f"{headline_row.sensitivity:.2f}"},
            {"l": "Specificity", "v": f"{headline_row.specificity:.2f}"},
            {"l": "F1 Score", "v": f"{headline_row.f1:.2f}"},
            {"l": "ROC-AUC", "v": f"{headline_row.roc_auc:.2f}"},
            {"l": "PR-AUC", "v": f"{(headline_row.pr_auc or 0):.2f}"},
            {"l": "Calibration", "v": f"{(headline_row.calibration or 0):.2f}"},
        ]
    else:
        h = snap.get("headline") or {}
        metrics = [
            {"l": "Sensitivity", "v": f"{float(h.get('sensitivity', 0)):.2f}"},
            {"l": "Specificity", "v": f"{float(h.get('specificity', 0)):.2f}"},
            {"l": "F1 Score", "v": f"{float(h.get('f1', 0)):.2f}"},
            {"l": "ROC-AUC", "v": f"{float(h.get('roc_auc', 0)):.2f}"},
            {"l": "PR-AUC", "v": f"{float(h.get('pr_auc', 0)):.2f}"},
            {"l": "Calibration", "v": f"{float(h.get('calibration', 0)):.2f}"},
        ]

    compare = [
        ModelBenchmarkOut(
            name=r.name,
            sensitivity=r.sensitivity,
            specificity=r.specificity,
            f1=r.f1,
            roc_auc=r.roc_auc,
            pr_auc=r.pr_auc,
            calibration=r.calibration,
            is_headline=r.is_headline,
        )
        for r in rows
        if not r.is_headline
    ]

    return ModelPerformanceOut(
        dataset=snap.get("dataset", "NetraX Eval"),
        threshold_label=snap.get("threshold_label", "Referable = Level 2+"),
        headline_metrics=metrics,
        models=compare,
        roc_points=snap.get("roc_points", ""),
        pr_points=snap.get("pr_points", ""),
        confusion=snap.get("confusion", {"tn": 0, "fp": 0, "fn": 0, "tp": 0}),
        class_distribution=snap.get("class_distribution", [0, 0, 0, 0, 0]),
        live_by_level=dict(live_levels),
        status="legacy_snapshot",
        note="Using legacy snapshot — prefer app/ml/eval_metrics.json",
        source="defaults/snapshot",
    )


@router.get("/quality", response_model=QualityAnalyticsOut)
def quality_analytics(
    db: Session = Depends(get_db),
    _: User = Depends(_roles),
):
    snap = _snapshot(db, "quality_analytics")
    centers = db.query(Center).order_by(Center.id.asc()).all()
    devices = db.query(Device).order_by(Device.id.asc()).all()

    # Prefer live center/device averages when present; keep seeded chart series as fallback.
    live_center = [
        {"name": c.name, "quality": float(c.quality_score)} for c in centers
    ]
    live_device = [
        {"name": d.device_id, "quality": float(d.avg_quality)} for d in devices
    ]

    qs = [s.quality_score for s in db.query(Screening).all() if s.quality_score is not None]
    avg_q = round(sum(qs) / len(qs), 1) if qs else float(snap.get("avg_quality", 0))

    return QualityAnalyticsOut(
        avg_quality=avg_q,
        good_pct=float(snap.get("good_pct", 0)),
        ungradeable_pct=float(snap.get("ungradeable_pct", 0)),
        recapture_pct=float(snap.get("recapture_pct", 0)),
        score_distribution=list(snap.get("score_distribution", [])),
        failures=[
            QualityFailureOut(label=f["label"], pct=float(f["pct"]), color=f.get("color", "#64748B"))
            for f in snap.get("failures", [])
        ],
        by_center=[int(c.quality_score) for c in centers] or list(snap.get("by_center", [])),
        center_labels=[c.name.replace("PHC ", "").replace("DH ", "")[:4] for c in centers]
        or list(snap.get("center_labels", [])),
        by_device=[int(d.avg_quality) for d in devices] or list(snap.get("by_device", [])),
        device_labels=[d.device_id.replace("FC-24", "FC-") for d in devices]
        or list(snap.get("device_labels", [])),
        recapture_monthly=list(snap.get("recapture_monthly", [])),
        live_center_quality=live_center,
        live_device_quality=live_device,
    )
