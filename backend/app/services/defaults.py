"""Code-level platform defaults — no full demo seed of users/patients."""

from __future__ import annotations

import json

from sqlalchemy.orm import Session

from app.models import AnalyticsSnapshot, AppSetting

MODEL_PERF_SNAPSHOT = {
    "dataset": "NetraX Eval",
    "threshold_label": "Referable = Level 2+",
    "roc_points": "M0,100 L20,40 L40,22 L60,12 L80,6 L100,2",
    "pr_points": "M0,100 L20,92 L40,84 L60,72 L80,55 L100,30",
    "confusion": {"tn": 820, "fp": 48, "fn": 36, "tp": 296},
    "class_distribution": [420, 180, 260, 140, 80],
    "headline": {
        "sensitivity": 0.93,
        "specificity": 0.91,
        "f1": 0.92,
        "roc_auc": 0.96,
        "pr_auc": 0.94,
        "calibration": 0.88,
    },
}

QUALITY_ANALYTICS_SNAPSHOT = {
    "avg_quality": 84.2,
    "good_pct": 78.0,
    "ungradeable_pct": 10.8,
    "recapture_pct": 11.2,
    "score_distribution": [12, 28, 45, 78, 112, 148, 186, 210, 168, 94, 42, 18],
    "failures": [
        {"label": "Poor Focus", "pct": 34, "color": "#E83340"},
        {"label": "Low Illumination", "pct": 28, "color": "#F57A0F"},
        {"label": "Incomplete Field of View", "pct": 18, "color": "#EA580C"},
        {"label": "Artifacts", "pct": 12, "color": "#7C3AED"},
        {"label": "Low Contrast", "pct": 8, "color": "#64748B"},
    ],
    "by_center": [86, 82, 78, 74, 88, 71],
    "center_labels": ["Shiv", "Belg", "Hub", "Dhar", "Kar", "Gad"],
    "by_device": [84, 79, 88, 76, 81],
    "device_labels": ["FC-01", "FC-02", "FC-03", "FC-04", "FC-05"],
    "recapture_monthly": [8, 9, 11, 10, 12, 11, 13, 12, 10, 9, 11, 10],
}

SIMULATION_CAPACITY = {
    "title": "District-Level Telemedicine Screening Capacity",
    "subtitle": "System-level capacity model for rural screening networks",
    "pipeline": [
        {"label": "Fundus Camera", "accent": "#475569"},
        {"label": "Image Acquisition", "accent": "#6129C7"},
        {"label": "Data Transfer", "accent": "#7C3AED"},
        {"label": "NetraX AI Processing", "accent": "#6129C7"},
        {"label": "Ophthalmologist Review", "accent": "#F57A0F"},
        {"label": "Referral", "accent": "#E83340"},
    ],
    "metrics": [
        {"label": "Patients / Year", "value": "100,000+", "color": "#6129C7"},
        {"label": "Average Images / Day", "value": "320", "color": "#121C2E"},
        {"label": "AI Throughput", "value": "180 / hour", "color": "#6129C7"},
        {"label": "Review Capacity", "value": "120 / hour", "color": "#F57A0F"},
        {"label": "Bandwidth Utilization", "value": "68%", "color": "#1AA16B"},
        {"label": "Estimated Referable DR", "value": "30.9%", "color": "#E83340"},
    ],
    "bottlenecks": [
        {"label": "Review Capacity", "detail": "120/hr vs peak demand 145/hr", "severity": "High", "color": "#E83340"},
        {"label": "Bandwidth", "detail": "68% avg · spikes to 92% at 14:00", "severity": "Medium", "color": "#F57A0F"},
        {"label": "AI Processing", "detail": "180/hr headroom available", "severity": "Low", "color": "#1AA16B"},
    ],
}

SIMULATION_DEFAULTS = {
    "phcs": 12,
    "images_day": 320,
    "bandwidth": 68,
    "ophthalmologists": 4,
    "ai_capacity_per_hour": 180,
}

SYSTEM_OPERATIONS = {
    "banner": "Platform health for screening workflow services.",
    "systems": [
        {"name": "AI Processing", "status": "Operational", "load": 62, "updated": "1 min ago", "color": "#6129C7"},
        {"name": "Network", "status": "Operational", "load": 68, "updated": "Just now", "color": "#1AA16B"},
        {"name": "Database", "status": "Operational", "load": 44, "updated": "2 min ago", "color": "#7C3AED"},
        {"name": "Fundus Devices", "status": "Operational", "load": 55, "updated": "5 min ago", "color": "#1AA16B"},
        {"name": "Review Queue", "status": "Operational", "load": 55, "updated": "3 min ago", "color": "#6129C7"},
        {"name": "Report Generation", "status": "Operational", "load": 31, "updated": "4 min ago", "color": "#1AA16B"},
    ],
}

APP_SETTINGS_DEFAULT = {
    "sections": [
        "Profile",
        "Notifications",
        "AI Screening Preferences",
        "Quality Thresholds",
        "Report Settings",
        "Security",
        "System Preferences",
    ],
    "inference_model": "Variational Quantum Classifier (VQC-ResNet)",
    "referral_threshold": "Level 2+ (Moderate NPDR and above) — Recommended",
    "explainability_enabled": True,
    "human_review_required": True,
    "notification_prefs": {
        "critical_alerts": True,
        "offline_sync": True,
        "daily_digest": True,
    },
    "report_blurb": "PDF format includes AI explainability Grad-CAM visuals, lesion counts, QR code verification, and multi-language patient guidance.",
    "security_blurb": "End-to-end encryption active with local cryptographic storage for offline biometric patient data.",
}

SNAPSHOT_DEFAULTS: dict[str, dict] = {
    "model_performance": MODEL_PERF_SNAPSHOT,
    "quality_analytics": QUALITY_ANALYTICS_SNAPSHOT,
    "simulation_capacity": SIMULATION_CAPACITY,
    "simulation_defaults": SIMULATION_DEFAULTS,
    "system_operations": SYSTEM_OPERATIONS,
}


def get_snapshot_default(key: str) -> dict | None:
    return SNAPSHOT_DEFAULTS.get(key)


def ensure_platform_defaults(db: Session) -> None:
    """Insert missing analytics snapshots, app settings, and default demo user."""
    from app.models import User
    from app.roles import ROLE_ADMIN, ROLE_OPERATOR, ROLE_OPHTHALMOLOGIST, ROLE_REVIEWER
    from app.services.auth import hash_password

    demo_users = [
        {
            "email": "operator@netrax.health",
            "full_name": "Priya Sharma",
            "role": ROLE_OPERATOR,
            "center": "PHC Shivapur",
            "password": "netrax123",
        },
        {
            "email": "arjun@netrax.health",
            "full_name": "Dr. Arjun Sharma",
            "role": ROLE_ADMIN,
            "center": "PHC Shivapur",
            "password": "netrax123",
        },
        {
            "email": "reviewer@netrax.health",
            "full_name": "Dr. Kavita Rao",
            "role": ROLE_REVIEWER,
            "center": "PHC Belgaum",
            "password": "netrax123",
        },
        {
            "email": "ophtho@netrax.health",
            "full_name": "Dr. Rajesh Patel",
            "role": ROLE_OPHTHALMOLOGIST,
            "center": "Hubli District Hospital",
            "password": "netrax123",
        },
    ]

    for u in demo_users:
        existing = db.query(User).filter(User.email == u["email"]).first()
        if not existing:
            db.add(
                User(
                    email=u["email"],
                    full_name=u["full_name"],
                    role=u["role"],
                    center=u["center"],
                    hashed_password=hash_password(u["password"]),
                    is_active=True,
                )
            )

    for key, payload in SNAPSHOT_DEFAULTS.items():
        exists = db.query(AnalyticsSnapshot).filter(AnalyticsSnapshot.key == key).first()
        if not exists:
            db.add(AnalyticsSnapshot(key=key, payload=json.dumps(payload)))

    platform = db.query(AppSetting).filter(AppSetting.key == "platform").first()
    if not platform:
        db.add(AppSetting(key="platform", value=json.dumps(APP_SETTINGS_DEFAULT)))

    db.commit()

