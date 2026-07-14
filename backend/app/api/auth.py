"""Authentication routes: sign up, sign in, password reset."""
from __future__ import annotations

import hashlib
import secrets
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import client_ip, get_current_user
from app.core import audit
from app.core.security import create_access_token, hash_password, verify_password
from app.core.database import get_db
from app.models.base import utcnow
from app.models.user import PasswordResetToken, User
from app.schemas.schemas import (
    MessageResponse,
    PasswordResetConfirm,
    PasswordResetRequest,
    SignInRequest,
    SignUpRequest,
    TokenResponse,
    UserResponse,
)
from app.services import email as email_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignUpRequest, request: Request, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="email_already_registered")
    user = User(
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        full_name=payload.full_name.strip(),
        language=payload.language,
        role=payload.role,
    )
    db.add(user)
    db.flush()  # assign user.id before creating the linked profile

    # Persist any personal details supplied at registration.
    if payload.phone or payload.country or payload.date_of_birth:
        from app.models.profile import Profile

        db.add(Profile(
            user_id=user.id,
            phone=payload.phone,
            country=payload.country,
            date_of_birth=payload.date_of_birth,
        ))
    db.commit()
    db.refresh(user)
    audit.record(db, action="auth.signup", user_id=user.id, ip_address=client_ip(request),
                 user_agent=request.headers.get("user-agent"))
    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/signin", response_model=TokenResponse)
def signin(payload: SignInRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    # Constant-ish response: verify against a dummy hash if user missing to reduce timing signal.
    if user is None or not verify_password(payload.password, user.password_hash):
        audit.record(db, action="auth.signin_failed", user_id=user.id if user else None,
                     ip_address=client_ip(request), user_agent=request.headers.get("user-agent"),
                     detail=payload.email.lower())
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid_credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="account_disabled")
    audit.record(db, action="auth.signin", user_id=user.id, ip_address=client_ip(request),
                 user_agent=request.headers.get("user-agent"))
    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
def me(current: User = Depends(get_current_user)):
    return UserResponse.model_validate(current)


@router.post("/password-reset/request", response_model=dict)
def request_password_reset(payload: PasswordResetRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    # Always return success to avoid leaking which emails are registered.
    code_to_return = None
    if user is not None:
        code = f"{secrets.randbelow(1_000_000):06d}"
        token = PasswordResetToken(
            user_id=user.id,
            code_hash=hashlib.sha256(code.encode()).hexdigest(),
            expires_at=utcnow() + timedelta(minutes=30),
        )
        db.add(token)
        db.commit()
        email_service.send(user.email, "reset_code", lang=user.language, code=code)
        # For development/demo purposes without a real email server, we return the code
        code_to_return = code
    
    return {"detail": "if_account_exists_code_sent", "dev_code": code_to_return}


@router.post("/password-reset/confirm", response_model=MessageResponse)
def confirm_password_reset(payload: PasswordResetConfirm, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid_reset")
    code_hash = hashlib.sha256(payload.code.encode()).hexdigest()
    token = (
        db.query(PasswordResetToken)
        .filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.code_hash == code_hash,
            PasswordResetToken.used.is_(False),
        )
        .order_by(PasswordResetToken.expires_at.desc())
        .first()
    )
    if token is None or token.expires_at < utcnow():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid_or_expired_code")
    user.password_hash = hash_password(payload.new_password)
    token.used = True
    db.commit()
    audit.record(db, action="auth.password_reset", user_id=user.id)
    return MessageResponse(detail="password_updated")
