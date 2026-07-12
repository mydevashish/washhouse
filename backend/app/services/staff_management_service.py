"""Enterprise staff management business logic."""

from __future__ import annotations

import secrets
import string
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthorizationError, NotFoundError, ValidationError
from app.core.security import hash_password
from app.models.enums import PartnerStaffRole, StaffActivityAction, UserRole
from app.models.partner_staff import PartnerStaff
from app.models.user import User
from app.repositories.staff_management import StaffManagementRepository
from app.services.staff_permissions import (
    PERM_STAFF_MANAGE,
    PERM_STAFF_VIEW,
    ROLE_LABELS,
    has_permission,
    normalize_role,
)


def _generate_temp_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$%"
    return "".join(secrets.choice(alphabet) for _ in range(length))


DEFAULT_WORK_SCHEDULE = {
    "days": ["mon", "tue", "wed", "thu", "fri", "sat"],
    "start_time": "09:00",
    "end_time": "18:00",
    "timezone": "Asia/Kolkata",
}


class StaffManagementService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = StaffManagementRepository(session)

    async def _resolve_laundry(self, actor_user_id: UUID, actor_role: str) -> tuple:
        """Return (laundry, actor_staff_or_none, is_owner)."""
        if actor_role == UserRole.partner.value:
            laundry = await self._repo.get_laundry_for_owner(actor_user_id)
            if not laundry:
                raise NotFoundError("Partner laundry not found")
            return laundry, None, True
        if actor_role == UserRole.partner_staff.value:
            staff = await self._repo.get_staff_by_user(actor_user_id)
            if not staff or not staff.is_active or staff.is_suspended:
                raise AuthorizationError()
            from app.models.laundry import Laundry
            laundry = await self._session.get(Laundry, staff.laundry_id)
            if not laundry:
                raise NotFoundError("Laundry not found")
            return laundry, staff, staff.role == PartnerStaffRole.owner
        raise AuthorizationError()

    async def _require_manage(self, actor_user_id: UUID, actor_role: str) -> tuple:
        laundry, staff, is_owner = await self._resolve_laundry(actor_user_id, actor_role)
        if is_owner:
            return laundry, staff
        if staff and has_permission(staff.role, PERM_STAFF_MANAGE):
            return laundry, staff
        raise AuthorizationError("Insufficient permissions to manage staff")

    def _serialize_staff(self, staff: PartnerStaff, laundry_name: str) -> dict:
        role_val = staff.role.value if hasattr(staff.role, "value") else str(staff.role)
        return {
            "id": staff.id,
            "laundry_id": staff.laundry_id,
            "laundry_name": laundry_name,
            "user_id": staff.user_id,
            "name": staff.name,
            "email": staff.email,
            "phone": staff.phone,
            "role": role_val,
            "role_label": ROLE_LABELS.get(role_val, role_val),
            "is_active": staff.is_active,
            "is_suspended": staff.is_suspended,
            "suspended_reason": staff.suspended_reason,
            "work_schedule": staff.work_schedule,
            "last_login_at": staff.last_login_at,
            "last_active_at": staff.last_active_at,
            "created_at": staff.created_at,
        }

    async def dashboard(self, actor_user_id: UUID, actor_role: str) -> dict:
        laundry, staff, is_owner = await self._resolve_laundry(actor_user_id, actor_role)
        if not is_owner and staff and staff.role not in (
            PartnerStaffRole.owner,
            PartnerStaffRole.manager,
        ):
            raise AuthorizationError()
        metrics = await self._repo.dashboard_metrics(laundry.id)
        metrics["laundry_id"] = laundry.id
        metrics["laundry_name"] = laundry.name
        return metrics

    async def list_staff(self, actor_user_id: UUID, actor_role: str) -> list[dict]:
        laundry, staff, is_owner = await self._resolve_laundry(actor_user_id, actor_role)
        if not is_owner and staff and staff.role not in (
            PartnerStaffRole.owner,
            PartnerStaffRole.manager,
        ):
            raise AuthorizationError()
        rows = await self._repo.list_staff(laundry.id)
        return [self._serialize_staff(r, laundry.name) for r in rows]

    async def create_staff(
        self,
        actor_user_id: UUID,
        actor_role: str,
        *,
        name: str,
        email: str,
        phone: str | None,
        role: PartnerStaffRole,
        laundry_id: UUID | None = None,
        password: str | None = None,
        work_schedule: dict | None = None,
    ) -> dict:
        laundry, actor_staff = await self._require_manage(actor_user_id, actor_role)
        if laundry_id and laundry_id != laundry.id:
            raise ValidationError("Invalid branch assignment")
        if role == PartnerStaffRole.owner and actor_role != UserRole.partner.value:
            raise AuthorizationError("Only the laundry owner can assign the Owner role")

        email_norm = email.strip().lower()
        if await self._repo.email_exists(email_norm) or await self._repo.user_email_exists(email_norm):
            raise ValidationError("Email already in use")

        temp_password = password or _generate_temp_password()
        user = User(
            email=email_norm,
            phone=phone,
            password_hash=hash_password(temp_password),
            full_name=name.strip(),
            role=UserRole.partner_staff,
            is_email_verified=True,
        )
        self._session.add(user)
        await self._session.flush()

        staff = PartnerStaff(
            laundry_id=laundry.id,
            user_id=user.id,
            name=name.strip(),
            email=email_norm,
            phone=phone,
            role=role,
            is_active=True,
            is_suspended=False,
            work_schedule=work_schedule or DEFAULT_WORK_SCHEDULE,
            created_by_user_id=actor_user_id,
        )
        self._session.add(staff)
        await self._session.flush()

        await self._repo.log_activity(
            laundry_id=laundry.id,
            action=StaffActivityAction.staff_created,
            staff_id=staff.id,
            actor_user_id=actor_user_id,
            resource_type="staff",
            resource_id=str(staff.id),
            description=f"Created staff account for {name}",
            metadata={"role": role.value, "email": email_norm},
        )

        result = self._serialize_staff(staff, laundry.name)
        result["temporary_password"] = temp_password if not password else None
        return result

    async def update_staff(
        self,
        actor_user_id: UUID,
        actor_role: str,
        staff_id: UUID,
        *,
        name: str | None = None,
        phone: str | None = None,
        role: PartnerStaffRole | None = None,
        laundry_id: UUID | None = None,
        work_schedule: dict | None = None,
    ) -> dict:
        laundry, _ = await self._require_manage(actor_user_id, actor_role)
        staff = await self._repo.get_staff(staff_id, laundry.id)
        if not staff:
            raise NotFoundError("Staff not found")
        if role == PartnerStaffRole.owner and actor_role != UserRole.partner.value:
            raise AuthorizationError("Only the laundry owner can assign the Owner role")
        if laundry_id and laundry_id != laundry.id:
            raise ValidationError("Invalid branch assignment")

        if name:
            staff.name = name.strip()
            if staff.user_id:
                user = await self._session.get(User, staff.user_id)
                if user:
                    user.full_name = name.strip()
        if phone is not None:
            staff.phone = phone
            if staff.user_id:
                user = await self._session.get(User, staff.user_id)
                if user:
                    user.phone = phone
        if role:
            staff.role = role
        if work_schedule is not None:
            staff.work_schedule = work_schedule

        await self._repo.log_activity(
            laundry_id=laundry.id,
            action=StaffActivityAction.staff_updated,
            staff_id=staff.id,
            actor_user_id=actor_user_id,
            resource_type="staff",
            resource_id=str(staff.id),
            description=f"Updated staff {staff.name}",
            metadata={"role": staff.role.value},
        )
        return self._serialize_staff(staff, laundry.name)

    async def set_active(
        self,
        actor_user_id: UUID,
        actor_role: str,
        staff_id: UUID,
        *,
        active: bool,
    ) -> dict:
        laundry, _ = await self._require_manage(actor_user_id, actor_role)
        staff = await self._repo.get_staff(staff_id, laundry.id)
        if not staff:
            raise NotFoundError("Staff not found")
        staff.is_active = active
        if not active:
            staff.deleted_at = None  # soft delete via is_active only
            await self._repo.log_activity(
                laundry_id=laundry.id,
                action=StaffActivityAction.staff_deactivated,
                staff_id=staff.id,
                actor_user_id=actor_user_id,
                resource_type="staff",
                resource_id=str(staff.id),
                description=f"Deactivated staff {staff.name}",
            )
        return self._serialize_staff(staff, laundry.name)

    async def deactivate_staff(self, actor_user_id: UUID, actor_role: str, staff_id: UUID) -> dict:
        return await self.set_active(actor_user_id, actor_role, staff_id, active=False)

    async def suspend_staff(
        self,
        actor_user_id: UUID,
        actor_role: str,
        staff_id: UUID,
        *,
        reason: str,
    ) -> dict:
        laundry, _ = await self._require_manage(actor_user_id, actor_role)
        staff = await self._repo.get_staff(staff_id, laundry.id)
        if not staff:
            raise NotFoundError("Staff not found")
        if not staff.is_active:
            raise ValidationError("Cannot suspend inactive staff")
        from datetime import UTC, datetime

        staff.is_suspended = True
        staff.suspended_at = datetime.now(UTC)
        staff.suspended_reason = reason.strip()
        await self._repo.log_activity(
            laundry_id=laundry.id,
            action=StaffActivityAction.staff_suspended,
            staff_id=staff.id,
            actor_user_id=actor_user_id,
            resource_type="staff",
            resource_id=str(staff.id),
            description=f"Suspended staff {staff.name}",
            metadata={"reason": reason},
        )
        return self._serialize_staff(staff, laundry.name)

    async def unsuspend_staff(self, actor_user_id: UUID, actor_role: str, staff_id: UUID) -> dict:
        laundry, _ = await self._require_manage(actor_user_id, actor_role)
        staff = await self._repo.get_staff(staff_id, laundry.id)
        if not staff:
            raise NotFoundError("Staff not found")
        if not staff.is_suspended:
            raise ValidationError("Staff is not suspended")
        staff.is_suspended = False
        staff.suspended_at = None
        staff.suspended_reason = None
        await self._repo.log_activity(
            laundry_id=laundry.id,
            action=StaffActivityAction.staff_unsuspended,
            staff_id=staff.id,
            actor_user_id=actor_user_id,
            resource_type="staff",
            resource_id=str(staff.id),
            description=f"Unsuspended staff {staff.name}",
        )
        return self._serialize_staff(staff, laundry.name)

    async def reset_password(
        self,
        actor_user_id: UUID,
        actor_role: str,
        staff_id: UUID,
        *,
        new_password: str | None = None,
    ) -> dict:
        laundry, _ = await self._require_manage(actor_user_id, actor_role)
        staff = await self._repo.get_staff(staff_id, laundry.id)
        if not staff or not staff.user_id:
            raise NotFoundError("Staff account not found")
        user = await self._session.get(User, staff.user_id)
        if not user:
            raise NotFoundError("User not found")
        temp = new_password or _generate_temp_password()
        user.password_hash = hash_password(temp)
        await self._repo.log_activity(
            laundry_id=laundry.id,
            action=StaffActivityAction.password_reset,
            staff_id=staff.id,
            actor_user_id=actor_user_id,
            resource_type="staff",
            resource_id=str(staff.id),
            description=f"Password reset for {staff.name}",
        )
        return {"staff_id": staff.id, "temporary_password": temp}

    async def list_activity(
        self,
        actor_user_id: UUID,
        actor_role: str,
        *,
        staff_id: UUID | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[dict]:
        laundry, staff, is_owner = await self._resolve_laundry(actor_user_id, actor_role)
        if not is_owner and staff and not has_permission(staff.role, PERM_STAFF_VIEW):
            raise AuthorizationError()
        return await self._repo.list_activity(laundry.id, staff_id=staff_id, limit=limit, offset=offset)

    async def record_login(self, user_id: UUID) -> None:
        staff = await self._repo.get_staff_by_user(user_id)
        if not staff:
            return
        if not staff.is_active or staff.is_suspended:
            return
        from datetime import UTC, datetime
        now = datetime.now(UTC)
        staff.last_login_at = now
        staff.last_active_at = now
        await self._repo.log_activity(
            laundry_id=staff.laundry_id,
            action=StaffActivityAction.login,
            staff_id=staff.id,
            actor_user_id=user_id,
            description=f"{staff.name} logged in",
        )

    async def record_logout(self, user_id: UUID) -> None:
        staff = await self._repo.get_staff_by_user(user_id)
        if not staff:
            return
        await self._repo.log_activity(
            laundry_id=staff.laundry_id,
            action=StaffActivityAction.logout,
            staff_id=staff.id,
            actor_user_id=user_id,
            description=f"{staff.name} logged out",
        )

    async def record_order_status_change(
        self,
        *,
        actor_user_id: UUID,
        order_id: UUID,
        laundry_id: UUID,
        old_status: str,
        new_status: str,
    ) -> None:
        staff = await self._repo.get_staff_by_user(actor_user_id)
        await self._repo.log_activity(
            laundry_id=laundry_id,
            action=StaffActivityAction.status_change,
            staff_id=staff.id if staff else None,
            actor_user_id=actor_user_id,
            resource_type="order",
            resource_id=str(order_id),
            description=f"Order status {old_status} → {new_status}",
            metadata={"old_status": old_status, "new_status": new_status},
        )
