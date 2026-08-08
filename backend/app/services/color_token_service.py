"""Shop Floor color token assignment (least-used color + daily sequence)."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from uuid import UUID
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import (
    COLOR_TOKEN_LETTERS,
    COLOR_TOKEN_PALETTE_ORDER,
    ColorToken,
    OrderStatus,
)
from app.models.order import Order

SHOP_TZ = ZoneInfo("Asia/Kolkata")

# Active floor bags: not Given / cancelled (Given maps to delivered or out_for_delivery).
_ACTIVE_TOKEN_STATUSES = (
    OrderStatus.confirmed,
    OrderStatus.pickup_assigned,
    OrderStatus.picked_up,
    OrderStatus.washing,
    OrderStatus.ironing,
    OrderStatus.ready,
)


@dataclass(frozen=True, slots=True)
class ColorTokenAssignment:
    color_token: ColorToken
    token_day_number: int
    token_code: str
    token_assigned_on: date


def ist_today(now: datetime | None = None) -> date:
    stamp = now or datetime.now(SHOP_TZ)
    if stamp.tzinfo is None:
        stamp = stamp.replace(tzinfo=SHOP_TZ)
    return stamp.astimezone(SHOP_TZ).date()


def format_token_code(color: ColorToken, day_number: int) -> str:
    return f"{COLOR_TOKEN_LETTERS[color]}-{day_number}"


class ColorTokenService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def allocate(self, laundry_id: UUID, *, on_day: date | None = None) -> ColorTokenAssignment:
        day = on_day or ist_today()
        color = await self._pick_least_used_color(laundry_id)
        day_number = await self._next_day_number(laundry_id, day)
        return ColorTokenAssignment(
            color_token=color,
            token_day_number=day_number,
            token_code=format_token_code(color, day_number),
            token_assigned_on=day,
        )

    async def assign_to_order(self, order: Order) -> Order:
        """Idempotent: skip if already tokenized."""
        if order.color_token is not None and order.token_code and order.token_day_number is not None:
            return order
        assignment = await self.allocate(order.laundry_id)
        order.color_token = assignment.color_token
        order.token_code = assignment.token_code
        order.token_day_number = assignment.token_day_number
        order.token_assigned_on = assignment.token_assigned_on
        await self._session.flush()
        return order

    async def _pick_least_used_color(self, laundry_id: UUID) -> ColorToken:
        result = await self._session.execute(
            select(Order.color_token, func.count())
            .where(
                Order.laundry_id == laundry_id,
                Order.deleted_at.is_(None),
                Order.color_token.is_not(None),
                Order.status.in_(_ACTIVE_TOKEN_STATUSES),
            )
            .group_by(Order.color_token),
        )
        counts = {row[0]: int(row[1]) for row in result.all() if row[0] is not None}
        return min(
            COLOR_TOKEN_PALETTE_ORDER,
            key=lambda color: (counts.get(color, 0), COLOR_TOKEN_PALETTE_ORDER.index(color)),
        )

    async def _next_day_number(self, laundry_id: UUID, day: date) -> int:
        result = await self._session.execute(
            select(func.coalesce(func.max(Order.token_day_number), 0)).where(
                Order.laundry_id == laundry_id,
                Order.token_assigned_on == day,
                Order.deleted_at.is_(None),
            ),
        )
        current = int(result.scalar_one() or 0)
        return current + 1
