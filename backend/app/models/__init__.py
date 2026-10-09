from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(64), default="Screening Operator")
    center: Mapped[str] = mapped_column(String(255), default="PHC Shivapur")
    hashed_password: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    patient_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    age: Mapped[int] = mapped_column(Integer)
    gender: Mapped[str] = mapped_column(String(16))
    mobile: Mapped[str | None] = mapped_column(String(32), nullable=True)
    center: Mapped[str] = mapped_column(String(255), default="PHC Shivapur")
    diabetes_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    diabetes_duration_years: Mapped[int | None] = mapped_column(Integer, nullable=True)
    previous_dr: Mapped[str | None] = mapped_column(String(128), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_screening_date: Mapped[str | None] = mapped_column(String(64), nullable=True)
    latest_dr_level: Mapped[int | None] = mapped_column(Integer, nullable=True)
    latest_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    queue_status: Mapped[str | None] = mapped_column(String(64), nullable=True)
    thumb_variant: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    screenings: Mapped[list["Screening"]] = relationship(back_populates="patient")
    reports: Mapped[list["Report"]] = relationship(back_populates="patient")


class Screening(Base):
    __tablename__ = "screenings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    screening_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    patient_pk: Mapped[int] = mapped_column(ForeignKey("patients.id"))
    center: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(64), default="created")
    step: Mapped[str] = mapped_column(String(64), default="created")
    quality_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    od_image_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    os_image_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    dr_level: Mapped[int | None] = mapped_column(Integer, nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    model_used: Mapped[str | None] = mapped_column(String(64), nullable=True)
    review_status: Mapped[str] = mapped_column(String(64), default="pending")
    referral_needed: Mapped[bool] = mapped_column(Boolean, default=False)
    screening_date: Mapped[str | None] = mapped_column(String(64), nullable=True)
    follow_up_date: Mapped[str | None] = mapped_column(String(64), nullable=True)
    follow_up_center: Mapped[str | None] = mapped_column(String(255), nullable=True)
    follow_up_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    quality_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    explainability_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    lesions_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    structure_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient: Mapped["Patient"] = relationship(back_populates="screenings")


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    report_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    patient_pk: Mapped[int] = mapped_column(ForeignKey("patients.id"))
    screening_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    severity: Mapped[str] = mapped_column(String(128))
    report_date: Mapped[str] = mapped_column(String(64))
    status: Mapped[str] = mapped_column(String(64), default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    patient: Mapped["Patient"] = relationship(back_populates="reports")


class Center(Base):
    __tablename__ = "centers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    location: Mapped[str] = mapped_column(String(255))
    device_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    daily_volume: Mapped[int] = mapped_column(Integer, default=0)
    quality_score: Mapped[int] = mapped_column(Integer, default=0)
    network_status: Mapped[str] = mapped_column(String(32), default="online")
    ophthalmologist_status: Mapped[str] = mapped_column(String(64), default="Available")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Device(Base):
    __tablename__ = "devices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    device_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    center: Mapped[str] = mapped_column(String(255))
    device_type: Mapped[str] = mapped_column(String(128))
    status: Mapped[str] = mapped_column(String(32), default="online")
    last_sync: Mapped[str] = mapped_column(String(64), default="")
    images_count: Mapped[int] = mapped_column(Integer, default=0)
    avg_quality: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    category: Mapped[str] = mapped_column(String(64))
    title: Mapped[str] = mapped_column(String(255))
    detail: Mapped[str] = mapped_column(Text)
    time_label: Mapped[str] = mapped_column(String(64))
    path: Mapped[str] = mapped_column(String(255), default="/dashboard")
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ModelBenchmark(Base):
    """Per-model eval metrics for Analytics → Model Performance."""

    __tablename__ = "model_benchmarks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    sensitivity: Mapped[float] = mapped_column(Float)
    specificity: Mapped[float] = mapped_column(Float)
    f1: Mapped[float] = mapped_column(Float)
    roc_auc: Mapped[float] = mapped_column(Float)
    pr_auc: Mapped[float | None] = mapped_column(Float, nullable=True)
    calibration: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_headline: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class AnalyticsSnapshot(Base):
    """JSON payloads for charts not derived from operational tables."""

    __tablename__ = "analytics_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    key: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    payload: Mapped[str] = mapped_column(Text)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class AppSetting(Base):
    """Global / platform preference key-value JSON."""

    __tablename__ = "app_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    key: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    value: Mapped[str] = mapped_column(Text)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
