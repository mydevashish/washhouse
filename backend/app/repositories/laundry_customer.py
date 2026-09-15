"""Shop customer persistence (unique phone per laundry)."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.laundry_customer import LaundryCustomer


class LaundryCustomerRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, customer_id: UUID, laundry_id: UUID) -> LaundryCustomer | None:
        return await self._session.scalar(
            select(LaundryCustomer).where(
                LaundryCustomer.id == customer_id,
                LaundryCustomer.laundry_id == laundry_id,
                LaundryCustomer.deleted_at.is_(None),
            ),
        )

    async def get_by_phone(self, laundry_id: UUID, phone: str) -> LaundryCustomer | None:
        return await self._session.scalar(
            select(LaundryCustomer).where(
                LaundryCustomer.laundry_id == laundry_id,
                LaundryCustomer.phone == phone,
                LaundryCustomer.deleted_at.is_(None),
            ),
        )

    async def search(
        self,
        laundry_id: UUID,
        *,
        term: str,
        limit: int = 20,
    ) -> list[LaundryCustomer]:
        like = f"%{term.strip()}%"
        result = await self._session.execute(
            select(LaundryCustomer)
            .where(
                LaundryCustomer.laundry_id == laundry_id,
                LaundryCustomer.deleted_at.is_(None),
                (LaundryCustomer.full_name.ilike(like) | LaundryCustomer.phone.ilike(like)),
            )
            .order_by(LaundryCustomer.updated_at.desc())
            .limit(limit),
        )
        return list(result.scalars().all())

    async def get_or_create(
        self,
        *,
        laundry_id: UUID,
        phone: str,
        full_name: str,
        title: str | None = None,
        plan_name: str | None = None,
        address_line1: str | None = None,
        address_line2: str | None = None,
        city: str | None = None,
        state: str | None = None,
        pincode: str | None = None,
        gender: str | None = None,
        notes: str | None = None,
        wallet_balance: int | None = None,
        user_id: UUID | None = None,
        registered_by_user_id: UUID | None = None,
    ) -> LaundryCustomer:
        existing = await self.get_by_phone(laundry_id, phone)
        name = full_name.strip() or "Walk-in customer"
        if existing:
            existing.full_name = name
            if title is not None:
                existing.title = title.strip() or None
            if plan_name is not None:
                existing.plan_name = plan_name.strip() or None
            if address_line1 is not None:
                existing.address_line1 = address_line1.strip() or None
            if address_line2 is not None:
                existing.address_line2 = address_line2.strip() or None
            if city is not None:
                existing.city = city.strip() or None
            if state is not None:
                existing.state = state.strip() or None
            if pincode is not None:
                existing.pincode = pincode.strip() or None
            if gender is not None:
                existing.gender = gender
            if notes is not None:
                existing.notes = notes.strip() or None
            if user_id is not None:
                existing.user_id = user_id
            await self._session.flush()
            return existing

        row = LaundryCustomer(
            laundry_id=laundry_id,
            phone=phone,
            full_name=name,
            title=title.strip() if title and title.strip() else None,
            plan_name=plan_name.strip() if plan_name and plan_name.strip() else None,
            address_line1=address_line1.strip() if address_line1 and address_line1.strip() else None,
            address_line2=address_line2.strip() if address_line2 and address_line2.strip() else None,
            city=city.strip() if city and city.strip() else None,
            state=state.strip() if state and state.strip() else None,
            pincode=pincode.strip() if pincode and pincode.strip() else None,
            gender=gender,
            notes=notes.strip() if notes and notes.strip() else None,
            user_id=user_id,
            registered_by_user_id=registered_by_user_id,
            wallet_balance=wallet_balance or 0,
        )
        self._session.add(row)
        await self._session.flush()
        return row
