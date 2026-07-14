"""Pydantic schemas (request/response contracts)."""
from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

Language = Literal["en", "ar"]


# ── Auth ─────────────────────────────────────────────────────────────────────
class SignUpRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=120)
    language: Language = "en"
    role: Literal["patient", "doctor"] = "patient"
    phone: Optional[str] = Field(default=None, max_length=40)
    country: Optional[str] = Field(default=None, max_length=60)
    date_of_birth: Optional[str] = Field(default=None, max_length=20)


class SignInRequest(BaseModel):
    email: EmailStr
    password: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    email: EmailStr
    code: str
    new_password: str = Field(min_length=8, max_length=128)


# ── User & profile ───────────────────────────────────────────────────────────
class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    email: EmailStr
    full_name: Optional[str] = None
    language: Language
    role: str = "patient"
    onboarding_complete: bool
    plan: str = "free"
    plan_status: str = "active"
    trial_ends_at: Optional[datetime] = None
    billing_cycle: Optional[str] = None
    created_at: datetime


class BillingStatusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    plan: str
    plan_status: str
    trial_ends_at: Optional[datetime] = None
    billing_cycle: Optional[str] = None
    trial_days_left: int = 0


class SubscribeRequest(BaseModel):
    billing_cycle: Literal["monthly", "yearly"] = "monthly"


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(min_length=1, max_length=30)


class ChatResponse(BaseModel):
    reply: str
    provider: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class UserUpdate(BaseModel):
    language: Optional[Language] = None
    full_name: Optional[str] = Field(default=None, max_length=120)


class ProfileUpdate(BaseModel):
    age: Optional[int] = Field(default=None, ge=0, le=120)
    sex: Optional[Literal["female", "male", "other", "prefer_not_to_say"]] = None
    phone: Optional[str] = Field(default=None, max_length=40)
    country: Optional[str] = Field(default=None, max_length=60)
    date_of_birth: Optional[str] = Field(default=None, max_length=20)
    family_history: Optional[List[str]] = None
    risk_factors: Optional[List[str]] = None


class ProfileResponse(BaseModel):
    age: Optional[int] = None
    sex: Optional[str] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    date_of_birth: Optional[str] = None
    family_history: List[str] = Field(default_factory=list)
    risk_factors: List[str] = Field(default_factory=list)


# ── Reports & markers ────────────────────────────────────────────────────────
ReportType = Literal["blood_panel", "tumor_markers", "biopsy", "pathology", "other"]


class MarkerValueResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    marker_key: str
    raw_label: Optional[str] = None
    value: Optional[float] = None
    unit: Optional[str] = None
    confidence: Optional[float] = None
    user_corrected: int = 0


class MarkerCorrection(BaseModel):
    marker_key: str
    value: Optional[float] = None
    unit: Optional[str] = None


class ReviewSubmit(BaseModel):
    """User-confirmed/corrected markers before analysis runs."""
    markers: List[MarkerCorrection]


class FlaggedMarker(BaseModel):
    marker_key: str
    value: Optional[float] = None
    unit: Optional[str] = None
    reference_low: Optional[float] = None
    reference_high: Optional[float] = None
    status: Literal["normal", "elevated", "high"]
    explanation_key: str


class RiskResultResponse(BaseModel):
    level: Literal["normal", "monitor", "follow_up"]
    score: float
    flagged: List[FlaggedMarker] = Field(default_factory=list)
    engine_version: str


class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    report_type: ReportType
    status: str
    source_language: Optional[str] = None
    original_filename: Optional[str] = None
    created_at: datetime
    markers: List[MarkerValueResponse] = Field(default_factory=list)


class ReportDetailResponse(ReportResponse):
    risk_result: Optional[RiskResultResponse] = None


# ── Reminders ────────────────────────────────────────────────────────────────
class ReminderCreate(BaseModel):
    kind: Literal["follow_up", "recheck", "custom"] = "follow_up"
    due_at: datetime
    custom_message: Optional[str] = None
    channel: Literal["in_app", "email"] = "in_app"


class ReminderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    kind: str
    due_at: datetime
    custom_message: Optional[str] = None
    sent: bool
    channel: str


class MessageResponse(BaseModel):
    detail: str


# ── Trends ───────────────────────────────────────────────────────────────────
class TrendPoint(BaseModel):
    report_id: str
    date: datetime
    value: float
    unit: Optional[str] = None
    status: str


class TrendSeries(BaseModel):
    marker_key: str
    points: List[TrendPoint]
