"""Report, extracted marker values, and risk-result models."""
from __future__ import annotations

from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, uuid_str

if TYPE_CHECKING:
    from app.models.user import User


class Report(Base, TimestampMixin):
    """A single uploaded lab report and its processing lifecycle."""

    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )

    # "blood_panel" | "tumor_markers" | "biopsy" | "pathology" | "other"
    report_type: Mapped[str] = mapped_column(String(30), default="other", nullable=False)
    # Lifecycle: uploaded -> extracting -> review -> analyzed  (or: failed)
    status: Mapped[str] = mapped_column(String(20), default="uploaded", nullable=False)

    # Opaque stored-file reference (UUID filename of the encrypted blob). Never the raw name.
    storage_key: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    original_filename: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    content_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    # Language(s) detected/declared in the report text: "en" | "ar" | "mixed"
    source_language: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    ocr_provider: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    user: Mapped["User"] = relationship(back_populates="reports")
    markers: Mapped[List["MarkerValue"]] = relationship(
        back_populates="report", cascade="all, delete-orphan"
    )
    risk_result: Mapped[Optional["RiskResult"]] = relationship(
        back_populates="report", uselist=False, cascade="all, delete-orphan"
    )


class MarkerValue(Base):
    """One extracted (and possibly user-corrected) marker reading."""

    __tablename__ = "marker_values"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    report_id: Mapped[str] = mapped_column(
        ForeignKey("reports.id", ondelete="CASCADE"), index=True, nullable=False
    )

    # Canonical marker key (e.g. "cea", "ca125", "psa", "afp", "ca19_9").
    marker_key: Mapped[str] = mapped_column(String(40), nullable=False)
    # As-printed label from the report (kept for transparency / correction UI).
    raw_label: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    unit: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    # OCR confidence 0..1; null when user-entered.
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    user_corrected: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    report: Mapped["Report"] = relationship(back_populates="markers")


class RiskResult(Base, TimestampMixin):
    """Output of the risk-scoring engine for one report."""

    __tablename__ = "risk_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    report_id: Mapped[str] = mapped_column(
        ForeignKey("reports.id", ondelete="CASCADE"), unique=True, index=True, nullable=False
    )

    # "normal" | "monitor" | "follow_up"
    level: Mapped[str] = mapped_column(String(20), nullable=False)
    score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    # JSON list of flagged-marker detail dicts (see risk engine).
    flagged: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    engine_version: Mapped[str] = mapped_column(String(30), default="placeholder-0.1", nullable=False)

    report: Mapped["Report"] = relationship(back_populates="risk_result")
