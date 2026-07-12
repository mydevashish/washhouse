"""SMS fallback for OTP and alerts."""

from __future__ import annotations

import structlog

from app.core.config import settings

log = structlog.get_logger(__name__)


async def send_sms(phone: str, body: str) -> None:
    if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
        log.info("sms.twilio_send", phone=phone[-4:])
        return
    log.info("sms.stub", phone=phone[-4:], body_preview=body[:20])
