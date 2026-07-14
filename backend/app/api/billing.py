"""Billing routes (mock). Manage a user's plan: start a Premium trial, subscribe,
and cancel. No real payment is processed — this is a placeholder with a clean
interface so a real processor (Stripe / Paymob) can be wired in later behind the
same endpoints."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.api.deps import client_ip, get_current_user
from app.core import audit
from app.core.database import get_db
from app.models.user import User
from app.schemas.schemas import BillingStatusResponse, MessageResponse, SubscribeRequest, UserResponse

router = APIRouter(prefix="/billing", tags=["billing"])

TRIAL_DAYS = 14


def _days_left(trial_ends_at: datetime | None) -> int:
    if not trial_ends_at:
        return 0
    # Stored value may be naive (SQLite); treat as UTC for the diff.
    end = trial_ends_at if trial_ends_at.tzinfo else trial_ends_at.replace(tzinfo=timezone.utc)
    delta = end - datetime.now(timezone.utc)
    return max(0, delta.days + (1 if delta.seconds > 0 else 0))


def _status(user: User) -> BillingStatusResponse:
    return BillingStatusResponse(
        plan=user.plan,
        plan_status=user.plan_status,
        trial_ends_at=user.trial_ends_at,
        billing_cycle=user.billing_cycle,
        trial_days_left=_days_left(user.trial_ends_at) if user.plan_status == "trialing" else 0,
    )


@router.get("/status", response_model=BillingStatusResponse)
def get_status(current: User = Depends(get_current_user)):
    return _status(current)


@router.post("/subscribe", response_model=UserResponse)
def subscribe(
    payload: SubscribeRequest,
    request: Request,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Start Premium. New Premium users begin a 14-day free trial (mock — no charge)."""
    starting_trial = current.plan != "premium"
    current.plan = "premium"
    current.billing_cycle = payload.billing_cycle
    if starting_trial:
        current.plan_status = "trialing"
        current.trial_ends_at = datetime.now(timezone.utc) + timedelta(days=TRIAL_DAYS)
    else:
        current.plan_status = "active"
    audit.record(db, action="billing.subscribe", user_id=current.id, ip_address=client_ip(request),
                 user_agent=request.headers.get("user-agent"), detail=payload.billing_cycle)
    db.commit()
    db.refresh(current)
    return UserResponse.model_validate(current)


@router.post("/cancel", response_model=UserResponse)
def cancel(
    request: Request,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cancel Premium and revert to the Free plan (mock)."""
    current.plan = "free"
    current.plan_status = "cancelled"
    current.trial_ends_at = None
    current.billing_cycle = None
    audit.record(db, action="billing.cancel", user_id=current.id, ip_address=client_ip(request),
                 user_agent=request.headers.get("user-agent"))
    db.commit()
    db.refresh(current)
    return UserResponse.model_validate(current)
