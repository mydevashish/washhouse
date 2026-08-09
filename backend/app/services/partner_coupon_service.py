"""Partner-managed shop coupon codes."""

from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, ValidationError
from app.models.loyalty import Coupon
from app.repositories.laundry import LaundryRepository


def discount_inr_for_subtotal(subtotal: Decimal, discount_percent: Decimal) -> Decimal:
    raw = (subtotal * discount_percent / Decimal("100")).quantize(Decimal("0.01"))
    return min(subtotal, raw)


class PartnerCouponService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._laundries = LaundryRepository(session)

    async def _laundry_for_partner(self, partner_user_id: UUID):
        laundry = await self._laundries.get_by_owner(partner_user_id)
        if not laundry:
            raise NotFoundError("Partner laundry not found")
        return laundry

    async def list_coupons(self, partner_user_id: UUID) -> list[Coupon]:
        laundry = await self._laundry_for_partner(partner_user_id)
        result = await self._session.execute(
            select(Coupon)
            .where(Coupon.laundry_id == laundry.id)
            .order_by(Coupon.created_at.desc()),
        )
        return list(result.scalars().all())

    async def create_coupon(
        self,
        partner_user_id: UUID,
        *,
        code: str,
        discount_percent: Decimal,
        is_active: bool = True,
    ) -> Coupon:
        laundry = await self._laundry_for_partner(partner_user_id)
        normalized = code.strip().upper()
        if not normalized or len(normalized) > 32:
            raise ValidationError("Coupon code must be 1–32 characters")
        if discount_percent <= 0 or discount_percent > 100:
            raise ValidationError("Discount must be between 0 and 100")

        existing = await self._session.execute(
            select(Coupon).where(
                Coupon.laundry_id == laundry.id,
                Coupon.code == normalized,
            ),
        )
        if existing.scalar_one_or_none():
            raise ValidationError("This code already exists for your shop")

        coupon = Coupon(
            laundry_id=laundry.id,
            code=normalized,
            discount_percent=discount_percent,
            is_active=is_active,
        )
        self._session.add(coupon)
        await self._session.commit()
        await self._session.refresh(coupon)
        return coupon

    async def update_coupon(
        self,
        partner_user_id: UUID,
        coupon_id: UUID,
        *,
        code: str | None = None,
        discount_percent: Decimal | None = None,
        is_active: bool | None = None,
    ) -> Coupon:
        laundry = await self._laundry_for_partner(partner_user_id)
        coupon = await self._get_owned(laundry.id, coupon_id)

        if code is not None:
            normalized = code.strip().upper()
            if not normalized:
                raise ValidationError("Coupon code is required")
            coupon.code = normalized
        if discount_percent is not None:
            if discount_percent <= 0 or discount_percent > 100:
                raise ValidationError("Discount must be between 0 and 100")
            coupon.discount_percent = discount_percent
        if is_active is not None:
            coupon.is_active = is_active

        await self._session.commit()
        await self._session.refresh(coupon)
        return coupon

    async def delete_coupon(self, partner_user_id: UUID, coupon_id: UUID) -> None:
        laundry = await self._laundry_for_partner(partner_user_id)
        coupon = await self._get_owned(laundry.id, coupon_id)
        await self._session.delete(coupon)
        await self._session.commit()

    async def validate_code(self, partner_user_id: UUID, code: str) -> Coupon:
        laundry = await self._laundry_for_partner(partner_user_id)
        normalized = code.strip().upper()
        result = await self._session.execute(
            select(Coupon).where(
                Coupon.laundry_id == laundry.id,
                Coupon.code == normalized,
                Coupon.is_active.is_(True),
            ),
        )
        coupon = result.scalar_one_or_none()
        if not coupon:
            raise NotFoundError("Coupon not found or inactive")
        return coupon

    async def resolve_discount(
        self,
        partner_user_id: UUID,
        *,
        coupon_code: str | None,
        subtotal: Decimal,
    ) -> tuple[Decimal, str | None]:
        if not coupon_code or not coupon_code.strip():
            return Decimal("0"), None
        coupon = await self.validate_code(partner_user_id, coupon_code)
        return discount_inr_for_subtotal(subtotal, coupon.discount_percent), coupon.code

    async def _get_owned(self, laundry_id: UUID, coupon_id: UUID) -> Coupon:
        result = await self._session.execute(
            select(Coupon).where(Coupon.id == coupon_id, Coupon.laundry_id == laundry_id),
        )
        coupon = result.scalar_one_or_none()
        if not coupon:
            raise NotFoundError("Coupon not found")
        return coupon
