"""Reminder routes: create, list, delete follow-up reminders."""
from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.reminder import Reminder
from app.models.user import User
from app.schemas.schemas import MessageResponse, ReminderCreate, ReminderResponse

router = APIRouter(prefix="/reminders", tags=["reminders"])


@router.post("", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
def create_reminder(
    payload: ReminderCreate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reminder = Reminder(
        user_id=current.id,
        kind=payload.kind,
        due_at=payload.due_at,
        custom_message=payload.custom_message,
        channel=payload.channel,
        language=current.language,  # send in the user's preferred language
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return ReminderResponse.model_validate(reminder)


@router.get("", response_model=List[ReminderResponse])
def list_reminders(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    reminders = (
        db.query(Reminder)
        .filter(Reminder.user_id == current.id)
        .order_by(Reminder.due_at.asc())
        .all()
    )
    return [ReminderResponse.model_validate(r) for r in reminders]


@router.delete("/{reminder_id}", response_model=MessageResponse)
def delete_reminder(
    reminder_id: str,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reminder = db.get(Reminder, reminder_id)
    if reminder is None or reminder.user_id != current.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="reminder_not_found")
    db.delete(reminder)
    db.commit()
    return MessageResponse(detail="reminder_deleted")
