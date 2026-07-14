"""Audit-logging helper — one call site for recording PHI access events."""
from __future__ import annotations

from typing import Optional

from sqlalchemy.orm import Session

from app.models.audit import AuditLog


def record(
    db: Session,
    *,
    action: str,
    user_id: Optional[str] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    detail: Optional[str] = None,
    commit: bool = True,
) -> None:
    """Append an audit entry. Best-effort: never let logging break the request."""
    try:
        entry = AuditLog(
            action=action,
            user_id=user_id,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=ip_address,
            user_agent=(user_agent or "")[:255] or None,
            detail=detail,
        )
        db.add(entry)
        if commit:
            db.commit()
    except Exception:  # noqa: BLE001 - audit must not raise into the request path
        db.rollback()
