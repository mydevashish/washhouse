"""Partner counter customer create / link / update."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthorizationError, NotFoundError, ValidationError
from app.models.enums import UserRole
from app.repositories.laundry_customer import LaundryCustomerRepository
from app.repositories.laundry_customer_registration import LaundryCustomerRegistrationRepository
from app.repositories.user import UserRepository
from app.services.customer_insights_service import CustomerInsightsService
from app.utils.phone import validate_strict_indian_mobile


class PartnerCustomerService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._users = UserRepository(session)
        self._registrations = LaundryCustomerRegistrationRepository(session)
        self._shop_customers = LaundryCustomerRepository(session)

    async def create_or_link(
        self,
        *,
        actor_user_id: UUID,
        actor_role: str,
        name: str,
        phone: str,
        title: str | None = None,
        plan_name: str | None = None,
        address_line1: str | None = None,
        address_line2: str | None = None,
        city: str | None = None,
        state: str | None = None,
        pincode: str | None = None,
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

        # Prevent duplicate shop-scoped customer creation: require unique phone per laundry
        existing = await self._shop_customers.get_by_phone(laundry.id, phone_e164)
        if existing:
            raise ValidationError("Mobile number already registered")

        await self._registrations.upsert(
            laundry_id=laundry.id,
            user_id=user.id,
            registered_by_user_id=actor_user_id,
        )

        # Initialize wallet balance for certain plans
        wallet_balance = 0
        if plan_name and plan_name.strip().lower() == 'mini plan':
            wallet_balance = 2200
        elif plan_name and plan_name.strip().lower() == 'value plan':
            wallet_balance = 5500

        shop = await self._shop_customers.get_or_create(
            laundry_id=laundry.id,
            phone=phone_e164,
            full_name=clean_name,
            title=title,
            plan_name=plan_name,
            address_line1=address_line1,
            address_line2=address_line2,
            city=city,
            state=state,
            pincode=pincode,
            user_id=user.id,
            registered_by_user_id=actor_user_id,
            wallet_balance=wallet_balance,
        )

        return {
            "customer_id": shop.id,
            "user_id": user.id,
            "name": shop.full_name,
            "phone": shop.phone,
            "title": shop.title,
            "plan_name": shop.plan_name,
            "address_line1": shop.address_line1,
            "address_line2": shop.address_line2,
            "city": shop.city,
            "state": shop.state,
            "pincode": shop.pincode,
            "wallet_balance": getattr(shop, 'wallet_balance', 0),
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
        title: str | None = None,
        plan_name: str | None = None,
        address_line1: str | None = None,
        address_line2: str | None = None,
        city: str | None = None,
        state: str | None = None,
        pincode: str | None = None,
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
        shop = None
        if user.phone:
            # If updating plan, adjust wallet balance: add new plan credit to existing remaining
            existing = await self._shop_customers.get_by_phone(laundry.id, user.phone)
            plan_credit = 0
            if plan_name and plan_name.strip():
                pn = plan_name.strip().lower()
                if 'mini' in pn:
                    plan_credit = 2200
                elif 'value' in pn:
                    plan_credit = 5500

            if existing:
                # preserve existing wallet and add plan credit only if plan changed
                new_wallet = int(getattr(existing, 'wallet_balance', 0) or 0)
                if plan_credit > 0 and (not existing.plan_name or existing.plan_name.strip().lower() != plan_name.strip().lower()):
                    new_wallet = new_wallet + plan_credit
                existing.full_name = clean_name
                existing.title = title
                existing.plan_name = plan_name
                existing.address_line1 = address_line1
                existing.address_line2 = address_line2
                existing.city = city
                existing.state = state
                existing.pincode = pincode
                existing.gender = gender
                existing.notes = notes
                existing.user_id = user.id
                existing.registered_by_user_id = actor_user_id
                existing.wallet_balance = new_wallet
                await self._session.flush()
                shop = existing
            else:
                # create new shop customer; initialize wallet with plan credit
                shop = await self._shop_customers.get_or_create(
                    laundry_id=laundry.id,
                    phone=user.phone,
                    full_name=clean_name,
                    title=title,
                    plan_name=plan_name,
                    address_line1=address_line1,
                    address_line2=address_line2,
                    city=city,
                    state=state,
                    pincode=pincode,
                    gender=gender,
                    notes=notes,
                    user_id=user.id,
                    registered_by_user_id=actor_user_id,
                    wallet_balance=plan_credit,
                )

        return {
            "customer_id": shop.id if shop else None,
            "user_id": user.id,
            "name": user.full_name,
            "phone": user.phone,
            "email": user.email,
            "gender": (shop.gender if shop else None) or registration.gender,
            "notes": (shop.notes if shop else None) or registration.crm_notes,
            "registered": True,
        }
