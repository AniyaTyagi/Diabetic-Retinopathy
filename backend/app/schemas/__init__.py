from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ── Auth ──────────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2)
    center: str = "PHC Shivapur"
    # Role is NOT chosen by the user at signup/login.
    # Self-register always becomes Screening Operator; admins assign other roles later.


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    role: str
    center: str
    is_active: bool


class UserRoleUpdate(BaseModel):
    role: str


class UserInvite(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2)
    role: str = "Screening Operator"
    center: str = "PHC Shivapur"


# ── Patients ──────────────────────────────────────────────────────────────────
class PatientCreate(BaseModel):
    patient_id: str = Field(..., examples=["P12347"])
    full_name: str
    age: int
    gender: str
    mobile: str | None = None
    center: str = "PHC Shivapur"
    diabetes_type: str | None = None
    diabetes_duration_years: int | None = None
    previous_dr: str | None = None
    notes: str | None = None


class PatientUpdate(BaseModel):
    full_name: str | None = None
    age: int | None = None
    gender: str | None = None
    mobile: str | None = None
    center: str | None = None
    diabetes_type: str | None = None
    diabetes_duration_years: int | None = None
    previous_dr: str | None = None
    notes: str | None = None


class PatientOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: str
    full_name: str
    age: int
    gender: str
    mobile: str | None
    center: str
    diabetes_type: str | None
    diabetes_duration_years: int | None
    previous_dr: str | None
    notes: str | None
    last_screening_date: str | None = None
    latest_dr_level: int | None = None
    latest_confidence: float | None = None
    queue_status: str | None = None
    thumb_variant: str | None = None
    created_at: datetime


# ── Screenings ────────────────────────────────────────────────────────────────
class ScreeningCreate(BaseModel):
    patient_id: str  # external patient_id like P12347
    center: str | None = None


class ScreeningStepUpdate(BaseModel):
    step: str
    status: str | None = None
    quality_score: float | None = None
    review_status: str | None = None
    referral_needed: bool | None = None


class ScreeningOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    screening_id: str
    patient_pk: int
    center: str
    status: str
    step: str
    quality_score: float | None
    od_image_path: str | None
    os_image_path: str | None
    dr_level: int | None
    confidence: float | None
    model_used: str | None
    review_status: str
    referral_needed: bool
    created_at: datetime
    updated_at: datetime


class ScreeningListItem(BaseModel):
    screening_id: str
    patient_id: str
    center: str
    date: str
    dr_level: int | None
    confidence: float | None
    model_used: str | None
    review_status: str


class AnalyzeRequest(BaseModel):
    model: str = "ensemble"  # ensemble (CNN+QML) | cnn | qml | mock


class AnalyzeResponse(BaseModel):
    screening_id: str
    status: str
    step: str
    dr_level: int
    confidence: float
    model_used: str
    referral_needed: bool
    message: str
    report_id: str | None = None


class QualityCheckOut(BaseModel):
    label: str
    status: str
    ok: bool | None = None


class QualityAssessmentOut(BaseModel):
    screening_id: str
    score: float
    suitable: bool
    status_label: str
    checks: list[QualityCheckOut]
    fundus_variant: str
    step: str
    status: str


class ResultsOut(BaseModel):
    screening_id: str
    patient_id: str
    patient_name: str
    center: str
    date: str | None = None
    dr_level: int | None
    confidence: float | None
    model_used: str | None
    referral_needed: bool
    review_status: str
    quality_score: float | None
    step: str
    status: str
    report_id: str | None = None
    has_od_image: bool = False
    has_os_image: bool = False
    per_eye: list[dict] | None = None
    quality: dict | None = None
    explainability: dict | None = None
    lesions: dict | None = None
    structure: dict | None = None
    follow_up_date: str | None = None
    follow_up_center: str | None = None
    follow_up_notes: str | None = None


class FollowUpIn(BaseModel):
    follow_up_date: str
    follow_up_center: str
    follow_up_notes: str | None = None


class FollowUpOut(BaseModel):
    screening_id: str
    follow_up_date: str | None
    follow_up_center: str | None
    follow_up_notes: str | None


# ── Reports / Analytics ───────────────────────────────────────────────────────
class ReportOut(BaseModel):
    report_id: str
    patient_id: str
    patient_name: str | None = None
    severity: str
    date: str
    status: str
    screening_id: str | None = None


class AnalyticsSummary(BaseModel):
    total_screenings: int
    today_screenings: int
    referred: int
    pending_review: int
    ungradeable: int
    by_level: dict[str, int]
    avg_confidence: float | None = None


class ModelBenchmarkOut(BaseModel):
    name: str
    sensitivity: float | None = None
    specificity: float | None = None
    f1: float | None = None
    roc_auc: float | None = None
    pr_auc: float | None = None
    calibration: float | None = None
    accuracy: float | None = None
    quadratic_kappa: float | None = None
    is_headline: bool = False


class ModelPerformanceOut(BaseModel):
    dataset: str
    threshold_label: str
    headline_metrics: list[dict[str, str]]
    models: list[ModelBenchmarkOut]
    roc_points: str
    pr_points: str
    confusion: dict[str, int]
    class_distribution: list[int]
    live_by_level: dict[str, int]
    status: str | None = None
    note: str | None = None
    source: str | None = None


class QualityFailureOut(BaseModel):
    label: str
    pct: float
    color: str


class QualityAnalyticsOut(BaseModel):
    avg_quality: float
    good_pct: float
    ungradeable_pct: float
    recapture_pct: float
    score_distribution: list[int]
    failures: list[QualityFailureOut]
    by_center: list[int]
    center_labels: list[str]
    by_device: list[int]
    device_labels: list[str]
    recapture_monthly: list[int]
    live_center_quality: list[dict[str, float | str]]
    live_device_quality: list[dict[str, float | str]]


class CenterOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    location: str
    device_id: str | None
    daily_volume: int
    quality_score: int
    network_status: str
    ophthalmologist_status: str


class CenterCreate(BaseModel):
    name: str
    location: str
    device_id: str | None = None
    daily_volume: int = 0
    quality_score: int = 0
    network_status: str = "online"
    ophthalmologist_status: str = "Available"


class CenterUpdate(BaseModel):
    name: str | None = None
    location: str | None = None
    device_id: str | None = None
    daily_volume: int | None = None
    quality_score: int | None = None
    network_status: str | None = None
    ophthalmologist_status: str | None = None


class DeviceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    device_id: str
    center: str
    device_type: str
    status: str
    last_sync: str
    images_count: int
    avg_quality: int


class DeviceCreate(BaseModel):
    device_id: str
    center: str
    device_type: str
    status: str = "online"
    last_sync: str = ""
    images_count: int = 0
    avg_quality: int = 0


class DeviceUpdate(BaseModel):
    center: str | None = None
    device_type: str | None = None
    status: str | None = None
    last_sync: str | None = None
    images_count: int | None = None
    avg_quality: int | None = None


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category: str
    title: str
    detail: str
    time_label: str
    path: str
    is_read: bool


class PipelineNodeOut(BaseModel):
    label: str
    accent: str


class CapacityMetricOut(BaseModel):
    label: str
    value: str
    color: str


class BottleneckOut(BaseModel):
    label: str
    detail: str
    severity: str
    color: str


class SimulationCapacityOut(BaseModel):
    title: str
    subtitle: str
    pipeline: list[PipelineNodeOut]
    metrics: list[CapacityMetricOut]
    bottlenecks: list[BottleneckOut]


class SimulationDefaultsOut(BaseModel):
    phcs: int
    images_day: int
    bandwidth: int
    ophthalmologists: int
    ai_capacity_per_hour: int


class SimulationDefaultsUpdate(BaseModel):
    phcs: int | None = None
    images_day: int | None = None
    bandwidth: int | None = None
    ophthalmologists: int | None = None
    ai_capacity_per_hour: int | None = None


class OpsSystemOut(BaseModel):
    name: str
    status: str
    load: int
    updated: str
    color: str


class OpsStatusOut(BaseModel):
    banner: str
    all_operational: bool
    systems: list[OpsSystemOut]
    offline_devices: int = 0
    total_devices: int = 0


class NotificationPrefsOut(BaseModel):
    critical_alerts: bool = True
    offline_sync: bool = True
    daily_digest: bool = True


class PlatformSettingsOut(BaseModel):
    sections: list[str]
    inference_model: str
    referral_threshold: str
    explainability_enabled: bool
    human_review_required: bool
    notification_prefs: NotificationPrefsOut
    report_blurb: str
    security_blurb: str
    profile_name: str | None = None
    profile_email: str | None = None
    profile_role: str | None = None
    profile_center: str | None = None


class PlatformSettingsUpdate(BaseModel):
    inference_model: str | None = None
    referral_threshold: str | None = None
    explainability_enabled: bool | None = None
    human_review_required: bool | None = None
    notification_prefs: NotificationPrefsOut | None = None
    report_blurb: str | None = None
    security_blurb: str | None = None
    sections: list[str] | None = None
