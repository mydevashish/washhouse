"""Laundry-scoped customer registration persistence."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import OrderStatus, UserRole
from app.models.laundry_customer_registration import LaundryCustomerRegistration
from app.models.order import Order
from app.models.user import User


class LaundryCustomerRegistrationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def upsert(
        self,
        *,
        laundry_id: UUID,
        user_id: UUID,
        registered_by_user_id: UUID,
    ) -> LaundryCustomerRegistration:
        stmt = (
            insert(LaundryCustomerRegistration)
            .values(
                laundry_id=laundry_id,
                user_id=user_id,
                registered_by_user_id=registered_by_user_id,
            )
            .on_conflict_do_nothing(
                index_elements=["laundry_id", "user_id"],
            )
            .returning(LaundryCustomerRegistration)
        )
        row = await self._session.scalar(stmt)
        if row is not None:
            return row
        existing = await self._session.scalar(
            select(LaundryCustomerRegistration).where(
                LaundryCustomerRegistration.laundry_id == laundry_id,
                LaundryCustomerRegistration.user_id == user_id,
            ),
        )
        assert existing is not None
        return existing

    async def get_for_laundry_user(
        self,
        laundry_id: UUID,
        user_id: UUID,
    ) -> LaundryCustomerRegistration | None:
        return await self._session.scalar(
            select(LaundryCustomerRegistration).where(
                LaundryCustomerRegistration.laundry_id == laundry_id,
                LaundryCustomerRegistration.user_id == user_id,
            ),
        )

    async def upsert_crm(
        self,
        *,
        laundry_id: UUID,
        user_id: UUID,
        registered_by_user_id: UUID,
        gender: str | None = None,
        crm_notes: str | None = None,
    ) -> LaundryCustomerRegistration:
        existing = await self.get_for_laundry_user(laundry_id, user_id)
        if existing is None:
            row = LaundryCustomerRegistration(
                laundry_id=laundry_id,
                user_id=user_id,
                registered_by_user_id=registered_by_user_id,
                gender=gender,
                crm_notes=crm_notes,
            )
            self._session.add(row)
            await self._session.flush()
            return row
        if gender is not None:
            existing.gender = gender
        if crm_notes is not None:
            existing.crm_notes = crm_notes.strip() if crm_notes.strip() else None
        await self._session.flush()
        return existing

    async def has_laundry_relationship(self, laundry_id: UUID, user_id: UUID) -> bool:
        registered = await self.get_for_laundry_user(laundry_id, user_id)
        if registered is not None:
            return True
        order_exists = await self._session.scalar(
            select(Order.id)
            .where(
                Order.laundry_id == laundry_id,
                Order.user_id == user_id,
                Order.deleted_at.is_(None),
                Order.status != OrderStatus.cancelled,
            )
            .limit(1),
        )
        return order_exists is not None

    async def registration_only_rows(
        self,
        laundry_id: UUID,
        *,
        search: str | None = None,
    ) -> list[dict]:
        """Customers registered at this laundry with no non-cancelled orders here."""
        has_order = (
            select(Order.id)
            .where(
                Order.laundry_id == laundry_id,
                Order.user_id == User.id,
                Order.deleted_at.is_(None),
                Order.status != OrderStatus.cancelled,
            )
            .correlate(User)
            .exists()
        )
        stmt = (
            select(
                User.id.label("user_id"),
                User.full_name,
                User.phone,
                User.trust_score,
                User.fraud_risk_level,
                LaundryCustomerRegistration.created_at.label("registered_at"),
            )
            .join(
                LaundryCustomerRegistration,
                LaundryCustomerRegistration.user_id == User.id,
            )
            .where(
                LaundryCustomerRegistration.laundry_id == laundry_id,
                User.deleted_at.is_(None),
                User.role == UserRole.customer,
                ~has_order,
            )
        )
        if search and search.strip():
            term = f"%{search.strip()}%"
            stmt = stmt.where(User.full_name.ilike(term) | User.phone.ilike(term))
        rows = await self._session.execute(stmt)
        from decimal import Decimal

        result: list[dict] = []
        for row in rows.all():
            risk = row.fraud_risk_level
            result.append(
                {
                    "user_id": row.user_id,
                    "name": row.full_name,
                    "phone": row.phone,
                    "trust_score": int(row.trust_score),
                    "fraud_risk_level": risk.value if hasattr(risk, "value") else str(risk),
                    "order_count": 0,
                    "total_spent_inr": Decimal("0"),
                    "last_order_at": None,
                    "first_order_at": None,
                    "dispute_count": 0,
                    "registered_at": row.registered_at,
                },
            )
        return result

    async def count_registration_only(self, laundry_id: UUID, *, search: str | None = None) -> int:
        has_order = (
            select(Order.id)
            .where(
                Order.laundry_id == laundry_id,
                Order.user_id == User.id,
                Order.deleted_at.is_(None),
                Order.status != OrderStatus.cancelled,
            )
            .correlate(User)
            .exists()
        )
        stmt = (
            select(LaundryCustomerRegistration.id)
            .join(User, User.id == LaundryCustomerRegistration.user_id)
            .where(
                LaundryCustomerRegistration.laundry_id == laundry_id,
                User.deleted_at.is_(None),
                User.role == UserRole.customer,
                ~has_order,
            )
        )
        if search and search.strip():
            term = f"%{search.strip()}%"
            stmt = stmt.where(User.full_name.ilike(term) | User.phone.ilike(term))
        from sqlalchemy import func

        return int(await self._session.scalar(select(func.count()).select_from(stmt.subquery())) or 0)
