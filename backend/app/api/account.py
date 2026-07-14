"""Profile, account settings, data export, and account deletion routes."""
from __future__ import annotations

import json

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.api.deps import client_ip, get_current_user
from app.core import audit
from app.core.database import get_db
from app.models.profile import Profile
from app.models.user import User
from app.schemas.schemas import (
    MessageResponse,
    ProfileResponse,
    ProfileUpdate,
    UserResponse,
    UserUpdate,
)

router = APIRouter(prefix="/account", tags=["account"])


def _profile_to_response(profile: Profile | None) -> ProfileResponse:
    if profile is None:
        return ProfileResponse()
    return ProfileResponse(
        age=profile.age,
        sex=profile.sex,
        phone=profile.phone,
        country=profile.country,
        date_of_birth=profile.date_of_birth,
        family_history=json.loads(profile.family_history) if profile.family_history else [],
        risk_factors=json.loads(profile.risk_factors) if profile.risk_factors else [],
    )


@router.get("/profile", response_model=ProfileResponse)
def get_profile(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _profile_to_response(current.profile)


@router.put("/profile", response_model=ProfileResponse)
def update_profile(
    payload: ProfileUpdate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = current.profile or Profile(user_id=current.id)
    if payload.age is not None:
        profile.age = payload.age
    if payload.sex is not None:
        profile.sex = payload.sex
    if payload.phone is not None:
        profile.phone = payload.phone
    if payload.country is not None:
        profile.country = payload.country
    if payload.date_of_birth is not None:
        profile.date_of_birth = payload.date_of_birth
    if payload.family_history is not None:
        profile.family_history = json.dumps(payload.family_history, ensure_ascii=False)
    if payload.risk_factors is not None:
        profile.risk_factors = json.dumps(payload.risk_factors, ensure_ascii=False)
    if current.profile is None:
        db.add(profile)
    # Completing onboarding is idempotent; first profile save marks it done.
    current.onboarding_complete = True
    db.commit()
    db.refresh(profile)
    return _profile_to_response(profile)


@router.post("/onboarding/skip", response_model=UserResponse)
def skip_onboarding(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current.onboarding_complete = True
    db.commit()
    db.refresh(current)
    return UserResponse.model_validate(current)


@router.put("/settings", response_model=UserResponse)
def update_settings(
    payload: UserUpdate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.language is not None:
        current.language = payload.language
    if payload.full_name is not None:
        current.full_name = payload.full_name.strip()
    db.commit()
    db.refresh(current)
    return UserResponse.model_validate(current)


@router.get("/export")
def export_data(request: Request, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return all of the user's data as JSON (privacy right: data portability)."""
    audit.record(db, action="account.export", user_id=current.id, ip_address=client_ip(request),
                 user_agent=request.headers.get("user-agent"))
    reports = []
    for r in current.reports:
        reports.append({
            "id": r.id,
            "report_type": r.report_type,
            "status": r.status,
            "source_language": r.source_language,
            "created_at": r.created_at.isoformat(),
            "markers": [
                {"marker_key": m.marker_key, "value": m.value, "unit": m.unit,
                 "confidence": m.confidence, "user_corrected": bool(m.user_corrected)}
                for m in r.markers
            ],
            "risk_result": (
                {"level": r.risk_result.level, "score": r.risk_result.score,
                 "flagged": json.loads(r.risk_result.flagged or "[]"),
                 "engine_version": r.risk_result.engine_version}
                if r.risk_result else None
            ),
        })
    return {
        "account": {"id": current.id, "email": current.email, "full_name": current.full_name,
                    "language": current.language, "created_at": current.created_at.isoformat()},
        "profile": _profile_to_response(current.profile).model_dump(),
        "reports": reports,
        "reminders": [
            {"id": rem.id, "kind": rem.kind, "due_at": rem.due_at.isoformat(),
             "custom_message": rem.custom_message, "sent": rem.sent, "channel": rem.channel}
            for rem in current.reminders
        ],
    }


@router.delete("/", response_model=MessageResponse)
def delete_account(request: Request, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Permanently delete the user and ALL their data, including stored files."""
    from app.services import storage

    # Remove encrypted files from storage before cascading DB delete.
    for r in current.reports:
        if r.storage_key:
            try:
                storage.delete(r.storage_key)
            except Exception:  # noqa: BLE001 - continue deleting the rest
                pass
    audit.record(db, action="account.delete", user_id=current.id, ip_address=client_ip(request),
                 user_agent=request.headers.get("user-agent"), commit=True)
    db.delete(current)  # cascades to profile, reports, markers, results, reminders
    db.commit()
    return MessageResponse(detail="account_deleted")
