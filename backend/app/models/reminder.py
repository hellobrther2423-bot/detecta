"""Reminder / follow-up notification schedule."""
from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, uuid_str

if TYPE_CHECKING:
    from app.models.user import User


class Reminder(Base, TimestampMixin):
    __tablename__ = "reminders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )

    # "follow_up" | "recheck" | "custom"
    kind: Mapped[str] = mapped_column(String(20), default="follow_up", nullable=False)
    message_key: Mapped[Optional[str]] = mapped_column(String(60), nullable=True)
    custom_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    due_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    # Language the notification should be sent in (defaults to user's at send time).
    language: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)
    sent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    channel: Mapped[str] = mapped_column(String(10), default="in_app", nullable=False)  # in_app | email

    user: Mapped["User"] = relationship(back_populates="reminders")
