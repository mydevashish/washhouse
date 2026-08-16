"""Partner counter customer create / link / update."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthorizationError, NotFoundError, ValidationError
from app.models.enums import UserRole
from app.repositories.laundry_customer_registration import LaundryCustomerRegistrationRepository
from app.repositories.user import UserRepository
from app.services.customer_insights_service import CustomerInsightsService
from app.utils.phone import validate_strict_indian_mobile


class PartnerCustomerService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._users = UserRepository(session)
        self._registrations = LaundryCustomerRegistrationRepository(session)

    async def create_or_link(
        self,
        *,
        actor_user_id: UUID,
        actor_role: str,
        name: str,
        phone: str,
    ) -> dict:
        laundry = await CustomerInsightsService(self._session).resolve_laundry_for_actor(
            actor_user_id,
            actor_role,
        )
        clean_name = name.strip()
        if not clean_name:
            raise ValidationError("Customer name is required")
        try:
            phone_e164 = validate_strict_indian_mobile(phone)
        except ValueError as exc:
            raise ValidationError(str(exc)) from exc

        user = await self._users.get_by_phone(phone_e164)
        if user is None:
            user = await self._users.create(
                email=None,
                phone=phone_e164,
                password_hash=None,
                full_name=clean_name,
                role=UserRole.customer,
                is_phone_verified=False,
            )
        elif user.role != UserRole.customer:
            raise ValidationError("Phone is registered to a non-customer account")
        elif clean_name and user.full_name != clean_name:
            user.full_name = clean_name
            await self._users.update(user)

        await self._registrations.upsert(
            laundry_id=laundry.id,
            user_id=user.id,
            registered_by_user_id=actor_user_id,
        )

        return {
            "user_id": user.id,
            "name": user.full_name,
            "phone": user.phone,
            "registered": True,
            "order_count": 0,
            "last_order_at": None,
        }

    async def update_profile(
        self,
        *,
        actor_user_id: UUID,
        actor_role: str,
        user_id: UUID | None = None,
        phone: str | None = None,
        name: str,
        email: str | None = None,
        gender: str | None = None,
        notes: str | None = None,
    ) -> dict:
        laundry = await CustomerInsightsService(self._session).resolve_laundry_for_actor(
            actor_user_id,
            actor_role,
        )
        clean_name = name.strip()
        if not clean_name:
            raise ValidationError("Customer name is required")

        user = None
        if user_id is not None:
            user = await self._users.get_by_id(user_id)
        elif phone is not None:
            try:
                phone_e164 = validate_strict_indian_mobile(phone)
            except ValueError as exc:
                raise ValidationError(str(exc)) from exc
            user = await self._users.get_by_phone(phone_e164)
        else:
            raise ValidationError("Customer identifier is required")

        if user is None or user.role != UserRole.customer:
            raise NotFoundError("Customer not found")

        if not await self._registrations.has_laundry_relationship(laundry.id, user.id):
            raise AuthorizationError("Customer is not associated with your laundry")

        user.full_name = clean_name
        if email is not None:
            user.email = email
        await self._users.update(user)

        registration = await self._registrations.upsert_crm(
            laundry_id=laundry.id,
            user_id=user.id,
            registered_by_user_id=actor_user_id,
            gender=gender,
            crm_notes=notes,
        )

        return {
            "user_id": user.id,
            "name": user.full_name,
            "phone": user.phone,
            "email": user.email,
            "gender": registration.gender,
            "notes": registration.crm_notes,
            "registered": True,
        }
