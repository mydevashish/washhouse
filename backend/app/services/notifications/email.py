"""Email channel helper for notification dispatch."""

from __future__ import annotations

import structlog

from app.core.exceptions import EmailDeliveryError, EmailNotConfiguredError
from app.services.email_service import EmailService

log = structlog.get_logger(__name__)


async def send_notification_email(
    *,
    to: str,
    subject: str,
    body: str,
    html: str | None = None,
) -> bool:
    """Send a notification email. Returns False when SMTP is unset (logged, no raise)."""
    service = EmailService()
    if not service.is_configured:
        log.warning("notification.email.skipped_not_configured", subject=subject[:80])
        return False
    try:
        await service.send(to=to, subject=subject, text=body, html=html)
        return True
    except (EmailNotConfiguredError, EmailDeliveryError):
        log.exception("notification.email.failed", subject=subject[:80])
        return False
