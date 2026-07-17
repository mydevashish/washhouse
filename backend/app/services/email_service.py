"""Outbound email via SMTP (aiosmtplib).

Requires SMTP_* settings. Raises domain errors — never opaque 500s for misconfig.
"""

from __future__ import annotations

from email.message import EmailMessage

import aiosmtplib
import structlog

from app.core.config import Settings, settings
from app.core.exceptions import EmailDeliveryError, EmailNotConfiguredError

log = structlog.get_logger(__name__)


def _mask_email(address: str) -> str:
    local, _, domain = address.partition("@")
    if not domain:
        return "***"
    visible = local[:1] if local else "*"
    return f"{visible}***@{domain}"


class EmailService:
    def __init__(self, config: Settings | None = None) -> None:
        self._settings = config or settings

    @property
    def is_configured(self) -> bool:
        return self._settings.smtp_is_configured

    def require_configured(self) -> None:
        if not self.is_configured:
            log.warning(
                "email.not_configured",
                smtp_host_set=bool(self._settings.SMTP_HOST),
                smtp_port=self._settings.SMTP_PORT,
                smtp_from_set=bool(self._settings.SMTP_FROM_EMAIL),
                smtp_username_set=bool(self._settings.SMTP_USERNAME),
            )
            raise EmailNotConfiguredError()

    async def send(
        self,
        *,
        to: str | list[str],
        subject: str,
        text: str,
        html: str | None = None,
        reply_to: str | None = None,
    ) -> None:
        """Send a plain-text (optional HTML) email. Logs success/failure without secrets."""
        self.require_configured()

        recipients = [to] if isinstance(to, str) else list(to)
        if not recipients:
            raise EmailDeliveryError("At least one recipient is required")

        message = EmailMessage()
        message["From"] = self._settings.SMTP_FROM_EMAIL
        message["To"] = ", ".join(recipients)
        message["Subject"] = subject
        if reply_to:
            message["Reply-To"] = reply_to
        message.set_content(text)
        if html:
            message.add_alternative(html, subtype="html")

        host = self._settings.SMTP_HOST
        port = self._settings.SMTP_PORT
        assert host is not None and port is not None

        use_ssl = self._settings.smtp_use_ssl
        start_tls = self._settings.smtp_use_tls
        username = self._settings.SMTP_USERNAME
        password = self._settings.SMTP_PASSWORD

        log.info(
            "email.send.start",
            host=host,
            port=port,
            use_ssl=use_ssl,
            start_tls=start_tls,
            auth=bool(username),
            to=[_mask_email(r) for r in recipients],
            subject=subject[:80],
        )

        try:
            await aiosmtplib.send(
                message,
                hostname=host,
                port=port,
                username=username,
                password=password,
                use_tls=use_ssl,
                start_tls=start_tls,
            )
        except EmailNotConfiguredError:
            raise
        except Exception as exc:
            log.exception(
                "email.send.failed",
                host=host,
                port=port,
                error_type=type(exc).__name__,
            )
            raise EmailDeliveryError(
                f"SMTP send failed ({type(exc).__name__}). Verify host, port, TLS mode, and credentials."
            ) from exc

        log.info(
            "email.send.ok",
            host=host,
            port=port,
            to=[_mask_email(r) for r in recipients],
            subject=subject[:80],
        )


def get_email_service() -> EmailService:
    return EmailService()
