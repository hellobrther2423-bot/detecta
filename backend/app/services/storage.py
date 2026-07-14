"""Encrypted file storage service.

Uploaded reports are highly sensitive PHI, so bytes are encrypted at rest with a
Fernet (AES-128-CBC + HMAC) key before touching disk, and stored under opaque
UUID keys (never the user's filename). This local-disk implementation implements
a small interface so an S3/GCS adapter with the same methods can replace it.
"""
from __future__ import annotations

import uuid
from pathlib import Path

from app.core.config import settings
from app.core.security import decrypt_bytes, encrypt_bytes

_STORAGE_DIR = Path(settings.storage_dir)


def _ensure_dir() -> None:
    _STORAGE_DIR.mkdir(parents=True, exist_ok=True)


def save_encrypted(data: bytes) -> str:
    """Encrypt and persist bytes; return an opaque storage key."""
    _ensure_dir()
    key = f"{uuid.uuid4().hex}.enc"
    (_STORAGE_DIR / key).write_bytes(encrypt_bytes(data))
    return key


def load_decrypted(storage_key: str) -> bytes:
    """Load and decrypt a previously stored blob."""
    path = _STORAGE_DIR / storage_key
    if not path.exists():
        raise FileNotFoundError(storage_key)
    return decrypt_bytes(path.read_bytes())


def delete(storage_key: str) -> None:
    path = _STORAGE_DIR / storage_key
    if path.exists():
        path.unlink()
