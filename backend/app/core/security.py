"""Security primitives: password hashing, JWT tokens, and at-rest file encryption."""
from __future__ import annotations

import base64
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import jwt
from cryptography.fernet import Fernet
from passlib.context import CryptContext

from app.core.config import settings

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ── Passwords ────────────────────────────────────────────────────────────────
def hash_password(plain: str) -> str:
    # bcrypt has a 72-byte input limit; pre-hash longer inputs so nothing is silently truncated.
    return _pwd_context.hash(_bcrypt_safe(plain))


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd_context.verify(_bcrypt_safe(plain), hashed)


def _bcrypt_safe(plain: str) -> str:
    raw = plain.encode("utf-8")
    if len(raw) <= 72:
        return plain
    return base64.b64encode(hashlib.sha256(raw).digest()).decode("ascii")


# ── JWT ──────────────────────────────────────────────────────────────────────
def create_access_token(subject: str, expires_minutes: Optional[int] = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=expires_minutes or settings.access_token_expire_minutes
    )
    payload: dict[str, Any] = {"sub": str(subject), "exp": expire, "type": "access"}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> Optional[dict[str, Any]]:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError:
        return None


# ── At-rest file encryption ──────────────────────────────────────────────────
def _fernet() -> Fernet:
    key = settings.storage_encryption_key.strip()
    if not key:
        # Derive a stable Fernet key from SECRET_KEY so dev works without extra config.
        # Production MUST set STORAGE_ENCRYPTION_KEY to an independent, managed key.
        digest = hashlib.sha256(settings.secret_key.encode("utf-8")).digest()
        key = base64.urlsafe_b64encode(digest).decode("ascii")
    return Fernet(key.encode("ascii") if isinstance(key, str) else key)


def encrypt_bytes(data: bytes) -> bytes:
    return _fernet().encrypt(data)


def decrypt_bytes(token: bytes) -> bytes:
    return _fernet().decrypt(token)
