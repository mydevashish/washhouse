"""Staff management persistence."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import OrderStatus, PartnerStaffRole, StaffActivityAction
from app.models.laundry import Laundry
from app.models.order import Order
from app.models.partner_staff import PartnerStaff
from app.models.staff_activity_log import StaffActivityLog
from app.models.user import User

ONLINE_THRESHOLD = timedelta(minutes=15)


class StaffManagementRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_laundry_for_owner(self, owner_user_id: UUID) -> Laundry | None:
        return await self._session.scalar(
            select(Laundry).where(Laundry.owner_user_id == owner_user_id, Laundry.deleted_at.is_(None)),
        )

    async def get_staff_by_user(self, user_id: UUID) -> PartnerStaff | None:
        return await self._session.scalar(
            select(PartnerStaff).where(
                PartnerStaff.user_id == user_id,
                PartnerStaff.deleted_at.is_(None),
            ),
        )

    async def get_staff(self, staff_id: UUID, laundry_id: UUID) -> PartnerStaff | None:
        return await self._session.scalar(
            select(PartnerStaff).where(
                PartnerStaff.id == staff_id,
                PartnerStaff.laundry_id == laundry_id,
                PartnerStaff.deleted_at.is_(None),
            ),
        )

    async def list_staff(self, laundry_id: UUID, *, include_inactive: bool = True) -> list[PartnerStaff]:
        q = select(PartnerStaff).where(
            PartnerStaff.laundry_id == laundry_id,
            PartnerStaff.deleted_at.is_(None),
        )
        if not include_inactive:
            q = q.where(PartnerStaff.is_active.is_(True))
        q = q.order_by(PartnerStaff.created_at.desc())
        return list((await self._session.scalars(q)).all())

    async def email_exists(self, email: str, *, exclude_staff_id: UUID | None = None) -> bool:
        q = select(func.count()).select_from(PartnerStaff).where(
            PartnerStaff.email == email,
            PartnerStaff.deleted_at.is_(None),
        )
        if exclude_staff_id:
            q = q.where(PartnerStaff.id != exclude_staff_id)
        return int(await self._session.scalar(q) or 0) > 0

    async def user_email_exists(self, email: str, *, exclude_user_id: UUID | None = None) -> bool:
        q = select(func.count()).select_from(User).where(User.email == email, User.deleted_at.is_(None))
        if exclude_user_id:
            q = q.where(User.id != exclude_user_id)
        return int(await self._session.scalar(q) or 0) > 0

    async def dashboard_metrics(self, laundry_id: UUID) -> dict:
        total = await self._session.scalar(
            select(func.count())
            .select_from(PartnerStaff)
            .where(PartnerStaff.laundry_id == laundry_id, PartnerStaff.deleted_at.is_(None)),
        )
        active = await self._session.scalar(
            select(func.count())
            .select_from(PartnerStaff)
            .where(
                PartnerStaff.laundry_id == laundry_id,
                PartnerStaff.deleted_at.is_(None),
                PartnerStaff.is_active.is_(True),
            ),
        )
        online_cutoff = datetime.now(UTC) - ONLINE_THRESHOLD
        online = await self._session.scalar(
            select(func.count())
            .select_from(PartnerStaff)
            .where(
                PartnerStaff.laundry_id == laundry_id,
                PartnerStaff.deleted_at.is_(None),
                PartnerStaff.is_active.is_(True),
                PartnerStaff.last_active_at.isnot(None),
                PartnerStaff.last_active_at >= online_cutoff,
            ),
        )
        pending_pickups = await self._session.scalar(
            select(func.count())
            .select_from(Order)
            .where(
                Order.laundry_id == laundry_id,
                Order.deleted_at.is_(None),
                Order.status.in_((OrderStatus.confirmed, OrderStatus.pickup_assigned)),
            ),
        )
        pending_deliveries = await self._session.scalar(
            select(func.count())
            .select_from(Order)
            .where(
                Order.laundry_id == laundry_id,
                Order.deleted_at.is_(None),
                Order.status == OrderStatus.out_for_delivery,
            ),
        )
        pending_processing = await self._session.scalar(
            select(func.count())
            .select_from(Order)
            .where(
                Order.laundry_id == laundry_id,
                Order.deleted_at.is_(None),
                Order.status.in_((OrderStatus.picked_up, OrderStatus.washing, OrderStatus.ironing, OrderStatus.ready)),
            ),
        )
        pending_tasks = int(pending_pickups or 0) + int(pending_deliveries or 0) + int(pending_processing or 0)
        inactive = int(total or 0) - int(active or 0)
        suspended = await self._session.scalar(
            select(func.count())
            .select_from(PartnerStaff)
            .where(
                PartnerStaff.laundry_id == laundry_id,
                PartnerStaff.deleted_at.is_(None),
                PartnerStaff.is_suspended.is_(True),
            ),
        )
        return {
            "total_staff": int(total or 0),
            "active_staff": int(active or 0),
            "online_staff": int(online or 0),
            "inactive_staff": inactive,
            "suspended_staff": int(suspended or 0),
            "pending_tasks": pending_tasks,
            "pending_pickups": int(pending_pickups or 0),
            "pending_deliveries": int(pending_deliveries or 0),
            "pending_processing": int(pending_processing or 0),
        }

    async def log_activity(
        self,
        *,
        laundry_id: UUID,
        action: StaffActivityAction,
        staff_id: UUID | None = None,
        actor_user_id: UUID | None = None,
        resource_type: str | None = None,
        resource_id: str | None = None,
        description: str | None = None,
        metadata: dict | None = None,
    ) -> StaffActivityLog:
        row = StaffActivityLog(
            staff_id=staff_id,
            laundry_id=laundry_id,
            actor_user_id=actor_user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            description=description,
            metadata_json=metadata,
        )
        self._session.add(row)
        await self._session.flush()
        return row

    async def list_activity(
        self,
        laundry_id: UUID,
        *,
        staff_id: UUID | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[dict]:
        q = (
            select(StaffActivityLog, PartnerStaff.name, User.full_name)
            .outerjoin(PartnerStaff, PartnerStaff.id == StaffActivityLog.staff_id)
            .outerjoin(User, User.id == StaffActivityLog.actor_user_id)
            .where(StaffActivityLog.laundry_id == laundry_id)
            .order_by(StaffActivityLog.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        if staff_id:
            q = q.where(or_(StaffActivityLog.staff_id == staff_id, StaffActivityLog.actor_user_id == staff_id))
        rows = await self._session.execute(q)
        return [
            {
                "id": log.id,
                "staff_id": log.staff_id,
                "staff_name": staff_name or actor_name or "System",
                "action": log.action.value,
                "resource_type": log.resource_type,
                "resource_id": log.resource_id,
                "description": log.description,
                "metadata": log.metadata_json or {},
                "created_at": log.created_at,
            }
            for log, staff_name, actor_name in rows.all()
        ]

    async def touch_active(self, staff: PartnerStaff) -> None:
        staff.last_active_at = datetime.now(UTC)
        await self._session.flush()
