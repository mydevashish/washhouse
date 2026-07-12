"""Delivery OTP persistence."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.delivery_otp import OrderDeliveryOtp


class DeliveryOtpRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_order(self, order_id: UUID) -> OrderDeliveryOtp | None:
        result = await self._session.execute(
            select(OrderDeliveryOtp).where(OrderDeliveryOtp.order_id == order_id),
        )
        return result.scalar_one_or_none()

    async def save(self, row: OrderDeliveryOtp) -> OrderDeliveryOtp:
        self._session.add(row)
        await self._session.flush()
        return row
