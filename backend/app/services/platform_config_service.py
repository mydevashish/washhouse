"""Platform configuration business logic with audit trail."""

from __future__ import annotations

import json
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, ValidationError
from app.core.platform_config_keys import (
    DEFAULT_DISPUTE_SLA_HOURS,
    DELIVERY_RADIUS_KM,
    DISPUTE_SLA_HOURS,
    DISPUTE_WINDOW_HOURS,
    NOTIFY_EMAIL_ENABLED,
    NOTIFY_IN_APP_ENABLED,
    NOTIFY_PUSH_ENABLED,
    NOTIFY_SMS_ENABLED,
    ORDER_MAX_AMOUNT_INR,
    ORDER_MIN_AMOUNT_INR,
    PICKUP_RADIUS_KM,
    PLATFORM_CONFIG_DEFAULTS,
    REFUND_WINDOW_HOURS,
    SESSION_IDLE_TIMEOUT_MINUTES,
    SESSION_WARNING_TIMEOUT_MINUTES,
)
from app.models.enums import AuditAction, UserRole
from app.models.laundry import Laundry
from app.models.platform import PlatformSetting
from app.repositories.audit import AuditRepository
from app.repositories.laundry import LaundryRepository
from app.repositories.platform import PlatformRepository
from app.repositories.platform_config import PlatformConfigRepository


class PlatformConfigService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = PlatformConfigRepository(session)
        self._platform = PlatformRepository(session)
        self._laundries = LaundryRepository(session)
        self._audit = AuditRepository(session)

    async def _audit_change(
        self,
        *,
        actor_user_id: UUID | None,
        category: str,
        key: str,
        old_value: str | None,
        new_value: str | None,
        resource_id: str | None = None,
    ) -> None:
        await self._audit.log(
            action=AuditAction.platform_config_change,
            actor_user_id=actor_user_id,
            resource_type="platform_config",
            resource_id=resource_id or key,
            metadata={
                "category": category,
                "key": key,
                "old_value": old_value,
                "new_value": new_value,
                "source": "admin_configuration_center",
            },
        )

    async def get_full_config(self) -> dict:
        default_rate = await self._platform.get_default_commission()
        keys = list(PLATFORM_CONFIG_DEFAULTS.keys())
        values = await self._repo.get_many(keys)
        partner_rows = await self._repo.list_partner_overrides()
        laundry_rows = await self._session.scalars(
            select(Laundry)
            .where(Laundry.deleted_at.is_(None), Laundry.commission_rate.isnot(None))
            .order_by(Laundry.name.asc())
            .limit(100),
        )
        laundries = list(laundry_rows.all())

        return {
            "commission": {
                "default_rate": str(default_rate),
                "laundry_overrides": [
                    {
                        "laundry_id": str(l.id),
                        "laundry_name": l.name,
                        "city": l.city,
                        "commission_rate": str(l.commission_rate),
                    }
                    for l in laundries
                ],
                "partner_overrides": [
                    {
                        "user_id": str(row.user_id),
                        "email": user.email,
                        "full_name": user.full_name,
                        "commission_rate": str(row.commission_rate),
                    }
                    for row, user in partner_rows
                ],
            },
            "order": {
                "min_amount_inr": values[ORDER_MIN_AMOUNT_INR],
                "max_amount_inr": values[ORDER_MAX_AMOUNT_INR],
                "pickup_radius_km": values[PICKUP_RADIUS_KM],
                "delivery_radius_km": values[DELIVERY_RADIUS_KM],
            },
            "dispute": {
                "dispute_window_hours": values[DISPUTE_WINDOW_HOURS],
                "refund_window_hours": values[REFUND_WINDOW_HOURS],
                "sla_hours": json.loads(values.get(DISPUTE_SLA_HOURS) or DEFAULT_DISPUTE_SLA_HOURS),
            },
            "session": {
                "idle_timeout_minutes": values[SESSION_IDLE_TIMEOUT_MINUTES],
                "warning_timeout_minutes": values[SESSION_WARNING_TIMEOUT_MINUTES],
            },
            "notification": {
                "email_enabled": PlatformConfigRepository.parse_bool(values[NOTIFY_EMAIL_ENABLED]),
                "sms_enabled": PlatformConfigRepository.parse_bool(values[NOTIFY_SMS_ENABLED]),
                "push_enabled": PlatformConfigRepository.parse_bool(values[NOTIFY_PUSH_ENABLED]),
                "in_app_enabled": PlatformConfigRepository.parse_bool(values[NOTIFY_IN_APP_ENABLED]),
            },
        }

    async def get_public_session_config(self) -> dict:
        values = await self._repo.get_many([SESSION_IDLE_TIMEOUT_MINUTES, SESSION_WARNING_TIMEOUT_MINUTES])
        return {
            "idle_timeout_minutes": int(values[SESSION_IDLE_TIMEOUT_MINUTES] or "30"),
            "warning_timeout_minutes": int(values[SESSION_WARNING_TIMEOUT_MINUTES] or "5"),
        }

    async def update_commission_default(self, rate: Decimal, *, actor_user_id: UUID) -> dict:
        if rate < Decimal("0") or rate > Decimal("100"):
            raise ValidationError("Commission must be between 0 and 100")
        old = str(await self._platform.get_default_commission())
        await self._platform.set(PlatformSetting.default_commission_key(), str(rate))
        await self._audit_change(
            actor_user_id=actor_user_id,
            category="commission",
            key="default_commission_rate",
            old_value=old,
            new_value=str(rate),
        )
        return {"default_rate": str(rate)}

    async def set_laundry_commission(
        self,
        laundry_id: UUID,
        rate: Decimal | None,
        *,
        actor_user_id: UUID,
    ) -> dict:
        if rate is not None and (rate < Decimal("0") or rate > Decimal("100")):
            raise ValidationError("Commission must be between 0 and 100")
        laundry = await self._laundries.get_by_id(laundry_id)
        if not laundry:
            raise NotFoundError("Laundry not found")
        old = str(laundry.commission_rate) if laundry.commission_rate is not None else None
        laundry.commission_rate = rate
        await self._session.flush()
        await self._audit_change(
            actor_user_id=actor_user_id,
            category="commission",
            key="laundry_commission",
            old_value=old,
            new_value=str(rate) if rate is not None else None,
            resource_id=str(laundry_id),
        )
        return {"laundry_id": str(laundry.id), "commission_rate": str(rate) if rate is not None else None}

    async def set_partner_commission(
        self,
        *,
        user_id: UUID | None = None,
        email: str | None = None,
        rate: Decimal,
        actor_user_id: UUID,
    ) -> dict:
        if rate < Decimal("0") or rate > Decimal("100"):
            raise ValidationError("Commission must be between 0 and 100")
        user = None
        if user_id:
            from app.repositories.user import UserRepository
            user = await UserRepository(self._session).get_by_id(user_id)
        elif email:
            user = await self._repo.get_partner_by_email(email)
        if not user:
            raise NotFoundError("Partner user not found")
        if user.role not in (UserRole.partner, UserRole.partner_staff):
            raise ValidationError("User is not a partner account")
        existing = await self._repo.get_partner_override(user.id)
        old = str(existing.commission_rate) if existing else None
        row = await self._repo.set_partner_override(user.id, rate)
        await self._audit_change(
            actor_user_id=actor_user_id,
            category="commission",
            key="partner_commission",
            old_value=old,
            new_value=str(rate),
            resource_id=str(user.id),
        )
        return {
            "user_id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "commission_rate": str(row.commission_rate),
        }

    async def remove_partner_commission(self, user_id: UUID, *, actor_user_id: UUID) -> None:
        existing = await self._repo.get_partner_override(user_id)
        if not existing:
            raise NotFoundError("Partner commission override not found")
        old = str(existing.commission_rate)
        await self._repo.delete_partner_override(user_id)
        await self._audit_change(
            actor_user_id=actor_user_id,
            category="commission",
            key="partner_commission",
            old_value=old,
            new_value=None,
            resource_id=str(user_id),
        )

    async def update_order_settings(
        self,
        *,
        min_amount_inr: Decimal,
        max_amount_inr: Decimal,
        pickup_radius_km: Decimal,
        delivery_radius_km: Decimal,
        actor_user_id: UUID,
    ) -> dict:
        if min_amount_inr < 0 or max_amount_inr <= min_amount_inr:
            raise ValidationError("Invalid order amount range")
        if pickup_radius_km <= 0 or delivery_radius_km <= 0:
            raise ValidationError("Radius must be positive")
        updates = {
            ORDER_MIN_AMOUNT_INR: str(min_amount_inr),
            ORDER_MAX_AMOUNT_INR: str(max_amount_inr),
            PICKUP_RADIUS_KM: str(pickup_radius_km),
            DELIVERY_RADIUS_KM: str(delivery_radius_km),
        }
        for key, new_val in updates.items():
            old = await self._repo.get_raw(key)
            await self._repo.set(key, new_val)
            await self._audit_change(
                actor_user_id=actor_user_id,
                category="order",
                key=key,
                old_value=old,
                new_value=new_val,
            )
        return updates

    async def update_dispute_settings(
        self,
        *,
        dispute_window_hours: int,
        refund_window_hours: int,
        sla_hours: dict[str, int],
        actor_user_id: UUID,
    ) -> dict:
        if dispute_window_hours < 1 or refund_window_hours < 1:
            raise ValidationError("Window must be at least 1 hour")
        required = {"low", "medium", "high", "critical"}
        if not required.issubset(sla_hours.keys()):
            raise ValidationError("SLA hours must include low, medium, high, critical")
        sla_json = json.dumps({k: int(sla_hours[k]) for k in required})
        updates = {
            DISPUTE_WINDOW_HOURS: str(dispute_window_hours),
            REFUND_WINDOW_HOURS: str(refund_window_hours),
            DISPUTE_SLA_HOURS: sla_json,
        }
        for key, new_val in updates.items():
            old = await self._repo.get_raw(key)
            await self._repo.set(key, new_val)
            await self._audit_change(
                actor_user_id=actor_user_id,
                category="dispute",
                key=key,
                old_value=old,
                new_value=new_val,
            )
        return {
            "dispute_window_hours": dispute_window_hours,
            "refund_window_hours": refund_window_hours,
            "sla_hours": json.loads(sla_json),
        }

    async def update_session_settings(
        self,
        *,
        idle_timeout_minutes: int,
        warning_timeout_minutes: int,
        actor_user_id: UUID,
    ) -> dict:
        if idle_timeout_minutes < 5 or warning_timeout_minutes < 1:
            raise ValidationError("Invalid session timeouts")
        if warning_timeout_minutes >= idle_timeout_minutes:
            raise ValidationError("Warning timeout must be less than idle timeout")
        updates = {
            SESSION_IDLE_TIMEOUT_MINUTES: str(idle_timeout_minutes),
            SESSION_WARNING_TIMEOUT_MINUTES: str(warning_timeout_minutes),
        }
        for key, new_val in updates.items():
            old = await self._repo.get_raw(key)
            await self._repo.set(key, new_val)
            await self._audit_change(
                actor_user_id=actor_user_id,
                category="session",
                key=key,
                old_value=old,
                new_value=new_val,
            )
        return {
            "idle_timeout_minutes": idle_timeout_minutes,
            "warning_timeout_minutes": warning_timeout_minutes,
        }

    async def update_notification_settings(
        self,
        *,
        email_enabled: bool,
        sms_enabled: bool,
        push_enabled: bool,
        in_app_enabled: bool,
        actor_user_id: UUID,
    ) -> dict:
        updates = {
            NOTIFY_EMAIL_ENABLED: "true" if email_enabled else "false",
            NOTIFY_SMS_ENABLED: "true" if sms_enabled else "false",
            NOTIFY_PUSH_ENABLED: "true" if push_enabled else "false",
            NOTIFY_IN_APP_ENABLED: "true" if in_app_enabled else "false",
        }
        for key, new_val in updates.items():
            old = await self._repo.get_raw(key)
            await self._repo.set(key, new_val)
            await self._audit_change(
                actor_user_id=actor_user_id,
                category="notification",
                key=key,
                old_value=old,
                new_value=new_val,
            )
        return {
            "email_enabled": email_enabled,
            "sms_enabled": sms_enabled,
            "push_enabled": push_enabled,
            "in_app_enabled": in_app_enabled,
        }

    async def list_config_audit(self, *, limit: int = 50) -> list[dict]:
        return await self._audit.list_logs(
            limit=limit,
            action=AuditAction.platform_config_change,
            resource_type="platform_config",
        )

    async def resolve_commission_rate(self, laundry: Laundry) -> Decimal:
        override = await self._repo.get_partner_override(laundry.owner_user_id)
        if override:
            return override.commission_rate
        if laundry.commission_rate is not None:
            return laundry.commission_rate
        return await self._platform.get_default_commission()

    async def get_order_limits(self) -> tuple[Decimal, Decimal]:
        values = await self._repo.get_many([ORDER_MIN_AMOUNT_INR, ORDER_MAX_AMOUNT_INR])
        return Decimal(values[ORDER_MIN_AMOUNT_INR]), Decimal(values[ORDER_MAX_AMOUNT_INR])

    async def get_dispute_window_hours(self) -> int:
        val = await self._repo.get(DISPUTE_WINDOW_HOURS)
        return int(val)

    async def get_refund_window_hours(self) -> int:
        val = await self._repo.get(REFUND_WINDOW_HOURS)
        return int(val)

    async def get_dispute_sla_hours(self) -> dict[str, int]:
        raw = await self._repo.get(DISPUTE_SLA_HOURS)
        parsed = PlatformConfigRepository.parse_json(raw)
        defaults = json.loads(DEFAULT_DISPUTE_SLA_HOURS)
        return {**defaults, **{k: int(v) for k, v in parsed.items()}}

    async def get_default_radii_km(self) -> tuple[Decimal, Decimal]:
        values = await self._repo.get_many([PICKUP_RADIUS_KM, DELIVERY_RADIUS_KM])
        return Decimal(values[PICKUP_RADIUS_KM]), Decimal(values[DELIVERY_RADIUS_KM])

    async def notifications_enabled(self) -> dict[str, bool]:
        values = await self._repo.get_many(
            [NOTIFY_EMAIL_ENABLED, NOTIFY_SMS_ENABLED, NOTIFY_PUSH_ENABLED, NOTIFY_IN_APP_ENABLED],
        )
        return {
            "email": PlatformConfigRepository.parse_bool(values[NOTIFY_EMAIL_ENABLED]),
            "sms": PlatformConfigRepository.parse_bool(values[NOTIFY_SMS_ENABLED]),
            "push": PlatformConfigRepository.parse_bool(values[NOTIFY_PUSH_ENABLED]),
            "in_app": PlatformConfigRepository.parse_bool(values[NOTIFY_IN_APP_ENABLED]),
        }
