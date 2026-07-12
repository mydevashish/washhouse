"""Payment provider abstraction (Razorpay)."""

from __future__ import annotations

import hashlib
import hmac
from decimal import Decimal
from typing import Protocol
from uuid import UUID

import httpx
import structlog

from app.core.config import settings

log = structlog.get_logger(__name__)


class PaymentProvider(Protocol):
    async def create_order(self, order_id: UUID, amount_inr: Decimal) -> dict: ...

    async def verify_webhook(self, body: bytes, signature: str) -> dict: ...


class RazorpayProvider:
    async def create_order(self, order_id: UUID, amount_inr: Decimal) -> dict:
        amount_paise = int(amount_inr * 100)
        if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
            log.warning("razorpay.not_configured", order_id=str(order_id))
            return {"razorpay_order_id": f"dev_{order_id}", "amount_paise": amount_paise}

        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                "https://api.razorpay.com/v1/orders",
                auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET),
                json={
                    "amount": amount_paise,
                    "currency": "INR",
                    "receipt": str(order_id),
                    "notes": {"dlm_order_id": str(order_id)},
                },
            )
            response.raise_for_status()
            data = response.json()
            return {
                "razorpay_order_id": data["id"],
                "amount_paise": data["amount"],
            }

    async def verify_webhook(self, body: bytes, signature: str) -> dict:
        if not settings.RAZORPAY_WEBHOOK_SECRET:
            if settings.APP_ENV not in ("local", "test"):
                from app.core.exceptions import ValidationError

                raise ValidationError("Webhook secret not configured")
            log.warning("razorpay.webhook_secret_missing")
            return {}
        if not signature:
            from app.core.exceptions import ValidationError

            raise ValidationError("Missing webhook signature")
        expected = hmac.new(
            settings.RAZORPAY_WEBHOOK_SECRET.encode(),
            body,
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(expected, signature):
            from app.core.exceptions import ValidationError

            raise ValidationError("Invalid webhook signature")
        return {"verified": True}


def get_payment_provider() -> PaymentProvider:
    return RazorpayProvider()
