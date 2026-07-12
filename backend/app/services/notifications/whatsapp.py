"""WhatsApp notification provider (stub + Twilio).

Walk-in order templates: order_received, order_in_progress, order_ready_for_pickup,
order_delivered. When TWILIO_WA_TEMPLATE_* SIDs are set, sends via ContentSid +
content_variables; otherwise plain body (Twilio sandbox).

Sandbox: recipient must send ``join <sandbox-keyword>`` to +1 415 523 8886 on WhatsApp.
See docs/features/offline-booking-whatsapp.md.
"""

from __future__ import annotations

import asyncio
import json
from typing import Protocol

import structlog

from app.core.config import settings

log = structlog.get_logger(__name__)

_TEMPLATE_CONTENT_SIDS: dict[str, str] = {
    "order_received": "TWILIO_WA_TEMPLATE_ORDER_RECEIVED",
    "order_in_progress": "TWILIO_WA_TEMPLATE_ORDER_IN_PROGRESS",
    "order_ready_for_pickup": "TWILIO_WA_TEMPLATE_ORDER_READY",
    "order_delivered": "TWILIO_WA_TEMPLATE_ORDER_DELIVERED",
}

_PLAIN_BODIES: dict[str, str] = {
    "otp_login": "Your DLM login code is {code}. Valid for 10 minutes.",
    "order_received": (
        "Hi {customer_name}! We've received your laundry order {tracking_code} at {laundry_name}. "
        "Status: {status_label}. We'll notify you as it progresses. Thank you for choosing DLM."
    ),
    "order_in_progress": (
        "Hi {customer_name}! Your order {tracking_code} at {laundry_name} is now {status_label}. "
        "Thank you for choosing DLM."
    ),
    "order_ready_for_pickup": (
        "Hi {customer_name}! Your order {tracking_code} at {laundry_name} is {status_label}. "
        "Please collect it at your earliest convenience. Thank you for choosing DLM."
    ),
    "order_delivered": (
        "Hi {customer_name}! Your order {tracking_code} at {laundry_name} has been {status_label}. "
        "Thank you for choosing DLM."
    ),
}


class WhatsAppProvider(Protocol):
    async def send_otp(self, phone: str, code: str) -> None: ...

    async def send_template(self, phone: str, template: str, variables: dict[str, str]) -> None: ...


def _whatsapp_address(phone: str) -> str:
    cleaned = phone.strip()
    if cleaned.startswith("whatsapp:"):
        return cleaned
    if cleaned.startswith("+"):
        return f"whatsapp:{cleaned}"
    return f"whatsapp:+{cleaned}"


def _whatsapp_from() -> str:
    raw = (settings.TWILIO_WHATSAPP_FROM or "").strip()
    if not raw:
        raise RuntimeError("TWILIO_WHATSAPP_FROM not configured")
    if raw.startswith("whatsapp:"):
        return raw
    if raw.startswith("+"):
        return f"whatsapp:{raw}"
    return f"whatsapp:+{raw}"


def _template_content_sid(template: str) -> str | None:
    setting_name = _TEMPLATE_CONTENT_SIDS.get(template)
    if not setting_name:
        return None
    return getattr(settings, setting_name, None) or None


def _render_plain_body(template: str, variables: dict[str, str]) -> str:
    pattern = _PLAIN_BODIES.get(template)
    if not pattern:
        return " ".join(f"{key}={value}" for key, value in variables.items())
    return pattern.format_map({**variables})


class StubWhatsAppProvider:
    """Logs messages in local/dev when WhatsApp is not configured."""

    async def send_otp(self, phone: str, code: str) -> None:
        log.info("whatsapp.otp_stub", phone=phone[-4:], template="otp_login")

    async def send_template(self, phone: str, template: str, variables: dict[str, str]) -> None:
        log.info("whatsapp.template_stub", phone=phone[-4:], template=template, variables=variables)


class TwilioWhatsAppProvider:
    """Twilio WhatsApp sender when credentials are present."""

    async def send_otp(self, phone: str, code: str) -> None:
        await self.send_template(phone, "otp_login", {"code": code})

    async def send_template(self, phone: str, template: str, variables: dict[str, str]) -> None:
        if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
            raise RuntimeError("Twilio not configured")

        from twilio.rest import Client

        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        kwargs: dict[str, str] = {
            "from_": _whatsapp_from(),
            "to": _whatsapp_address(phone),
        }
        content_sid = _template_content_sid(template)
        if content_sid:
            kwargs["content_sid"] = content_sid
            kwargs["content_variables"] = json.dumps(variables)
        else:
            kwargs["body"] = _render_plain_body(template, variables)

        message = await asyncio.to_thread(client.messages.create, **kwargs)
        log.info(
            "whatsapp.twilio_sent",
            phone=phone[-4:],
            template=template,
            message_sid=getattr(message, "sid", None),
        )


def get_whatsapp_provider() -> WhatsAppProvider:
    if (
        settings.TWILIO_ACCOUNT_SID
        and settings.TWILIO_AUTH_TOKEN
        and settings.TWILIO_WHATSAPP_FROM
    ):
        return TwilioWhatsAppProvider()
    return StubWhatsAppProvider()
