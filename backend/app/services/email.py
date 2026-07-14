"""Email service — sends localized messages (reset codes, reminders).

Defaults to a console provider that logs the message (no account needed). Set
SMTP_* env vars to send real email. Message bodies are localized to the user's
preferred language.
"""
from __future__ import annotations

import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger("detectoma.email")


# ── Localized templates ──────────────────────────────────────────────────────
_TEMPLATES = {
    "reset_code": {
        "en": ("DETECTOMA password reset", "Your DETECTOMA reset code is: {code}\nIt expires in 30 minutes."),
        "ar": ("إعادة تعيين كلمة مرور ديتكتوما", "رمز إعادة التعيين الخاص بك في ديتكتوما هو: {code}\nتنتهي صلاحيته خلال 30 دقيقة."),
    },
    "reminder": {
        "en": ("DETECTOMA reminder", "This is your DETECTOMA follow-up reminder: {message}"),
        "ar": ("تذكير من ديتكتوما", "هذا تذكير المتابعة من ديتكتوما: {message}"),
    },
}


def _render(template: str, lang: str, **kwargs) -> tuple[str, str]:
    variants = _TEMPLATES[template]
    subject, body = variants.get(lang, variants["en"])
    return subject, body.format(**kwargs)


def _use_smtp() -> bool:
    if settings.email_provider == "console":
        return False
    if settings.email_provider == "smtp":
        return True
    return bool(settings.smtp_host)  # auto


def send(to: str, template: str, lang: str = "en", **kwargs) -> None:
    subject, body = _render(template, lang, **kwargs)
    if not _use_smtp():
        # Console provider: log so developers can see reset codes during dev.
        logger.info("[EMAIL:mock] to=%s | %s | %s", to, subject, body)
        return
    msg = EmailMessage()
    msg["From"] = settings.email_from
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
        server.starttls()
        if settings.smtp_user:
            server.login(settings.smtp_user, settings.smtp_password)
        server.send_message(msg)
    logger.info("[EMAIL:smtp] sent to=%s subject=%s", to, subject)
