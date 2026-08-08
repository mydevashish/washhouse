"""Idempotent invoice number allocation for partner bills / GST invoices."""

from __future__ import annotations

from datetime import UTC, datetime
from zoneinfo import ZoneInfo

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order

IST = ZoneInfo("Asia/Kolkata")


def format_invoice_number(*, year: int, tracking_code: str) -> str:
    """Stable unique invoice id derived from tracking (already unique)."""
    return f"WH-{year}-{tracking_code}"


class InvoiceService:
    """Allocate `orders.invoice_number` once; never mutate money fields."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def ensure_invoice_number(self, order: Order) -> str:
        """Return existing invoice_number or allocate once (idempotent reprint-safe)."""
        if order.invoice_number:
            return order.invoice_number

        created = order.created_at
        if created is not None:
            if created.tzinfo is None:
                created = created.replace(tzinfo=UTC)
            year = created.astimezone(IST).year
        else:
            year = datetime.now(IST).year

        order.invoice_number = format_invoice_number(
            year=year,
            tracking_code=order.tracking_code,
        )
        await self._session.flush()
        return order.invoice_number
