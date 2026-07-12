"""Announcement persistence."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.announcement import Announcement, AnnouncementEvent
from app.models.enums import (
    AnnouncementEventType,
    AnnouncementStatus,
    AnnouncementTarget,
    OrderStatus,
    UserRole,
)
from app.models.laundry import Laundry
from app.models.order import Order
from app.models.partner_staff import PartnerStaff
from app.models.user import User
from app.models.user_address import UserAddress


class AnnouncementRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get(self, announcement_id: UUID) -> Announcement | None:
        return await self._session.get(Announcement, announcement_id)

    async def list_admin(
        self,
        *,
        status: AnnouncementStatus | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Announcement]:
        q = select(Announcement).order_by(Announcement.created_at.desc()).limit(limit).offset(offset)
        if status:
            q = q.where(Announcement.status == status)
        return list((await self._session.scalars(q)).all())

    async def count_admin(self, *, status: AnnouncementStatus | None = None) -> int:
        q = select(func.count()).select_from(Announcement)
        if status:
            q = q.where(Announcement.status == status)
        return int(await self._session.scalar(q) or 0)

    async def create(self, announcement: Announcement) -> Announcement:
        self._session.add(announcement)
        await self._session.flush()
        return announcement

    async def list_due_scheduled(self, now: datetime) -> list[Announcement]:
        return list(
            (
                await self._session.scalars(
                    select(Announcement).where(
                        Announcement.status == AnnouncementStatus.scheduled,
                        Announcement.scheduled_at.isnot(None),
                        Announcement.scheduled_at <= now,
                    ),
                )
            ).all(),
        )

    async def list_published(self) -> list[Announcement]:
        return list(
            (
                await self._session.scalars(
                    select(Announcement)
                    .where(Announcement.status == AnnouncementStatus.published)
                    .order_by(Announcement.published_at.desc()),
                )
            ).all(),
        )

    async def user_has_event(
        self,
        announcement_id: UUID,
        user_id: UUID,
        event_type: AnnouncementEventType,
    ) -> bool:
        row = await self._session.scalar(
            select(AnnouncementEvent.id).where(
                AnnouncementEvent.announcement_id == announcement_id,
                AnnouncementEvent.user_id == user_id,
                AnnouncementEvent.event_type == event_type,
            ),
        )
        return row is not None

    async def record_event(
        self,
        *,
        announcement_id: UUID,
        user_id: UUID,
        event_type: AnnouncementEventType,
    ) -> bool:
        """Record event; returns True if counter was incremented."""
        if event_type in (AnnouncementEventType.view, AnnouncementEventType.acknowledge):
            if await self.user_has_event(announcement_id, user_id, event_type):
                return False
        self._session.add(
            AnnouncementEvent(
                announcement_id=announcement_id,
                user_id=user_id,
                event_type=event_type,
            ),
        )
        await self._session.flush()
        return True

    async def user_matches_target(self, user: User, announcement: Announcement) -> bool:
        target = announcement.target_type
        if target == AnnouncementTarget.all_users:
            return True
        if target == AnnouncementTarget.customers:
            return user.role == UserRole.customer
        if target == AnnouncementTarget.partners:
            return user.role in (UserRole.partner, UserRole.partner_staff)
        if target == AnnouncementTarget.specific_laundries:
            return await self._user_in_laundry_targets(user.id, announcement.target_laundry_ids)
        if target == AnnouncementTarget.specific_cities:
            return await self._user_in_city_targets(user, announcement.target_cities)
        return False

    async def _user_in_laundry_targets(self, user_id: UUID, laundry_ids: list[UUID]) -> bool:
        if not laundry_ids:
            return False
        owner = await self._session.scalar(
            select(Laundry.id).where(Laundry.owner_user_id == user_id, Laundry.id.in_(laundry_ids)),
        )
        if owner:
            return True
        staff = await self._session.scalar(
            select(PartnerStaff.laundry_id).where(
                PartnerStaff.user_id == user_id,
                PartnerStaff.laundry_id.in_(laundry_ids),
                PartnerStaff.is_active.is_(True),
            ),
        )
        if staff:
            return True
        ordered = await self._session.scalar(
            select(Order.id).where(
                Order.user_id == user_id,
                Order.laundry_id.in_(laundry_ids),
                Order.deleted_at.is_(None),
                Order.status != OrderStatus.cancelled,
            ).limit(1),
        )
        return ordered is not None

    async def _user_in_city_targets(self, user: User, cities: list[str]) -> bool:
        if not cities:
            return False
        normalized = [c.strip().lower() for c in cities if c.strip()]
        if user.role in (UserRole.partner, UserRole.partner_staff):
            if user.role == UserRole.partner:
                laundry = await self._session.scalar(
                    select(Laundry.city).where(Laundry.owner_user_id == user.id, Laundry.deleted_at.is_(None)),
                )
                if laundry and laundry.lower() in normalized:
                    return True
            staff_laundry = await self._session.scalar(
                select(Laundry.city)
                .join(PartnerStaff, PartnerStaff.laundry_id == Laundry.id)
                .where(PartnerStaff.user_id == user.id, PartnerStaff.is_active.is_(True)),
            )
            if staff_laundry and staff_laundry.lower() in normalized:
                return True
        address = await self._session.scalar(
            select(UserAddress.city).where(
                UserAddress.user_id == user.id,
                func.lower(UserAddress.city).in_(normalized),
            ).limit(1),
        )
        if address:
            return True
        order_city = await self._session.scalar(
            select(Laundry.city)
            .join(Order, Order.laundry_id == Laundry.id)
            .where(
                Order.user_id == user.id,
                Order.deleted_at.is_(None),
                Order.status != OrderStatus.cancelled,
                func.lower(Laundry.city).in_(normalized),
            ).limit(1),
        )
        return order_city is not None

    async def resolve_targeted_user_ids(self, announcement: Announcement) -> list[UUID]:
        """Best-effort user list for email/push dispatch on publish."""
        if announcement.target_type == AnnouncementTarget.all_users:
            rows = await self._session.scalars(select(User.id).where(User.deleted_at.is_(None)))
            return list(rows.all())
        if announcement.target_type == AnnouncementTarget.customers:
            rows = await self._session.scalars(
                select(User.id).where(User.deleted_at.is_(None), User.role == UserRole.customer),
            )
            return list(rows.all())
        if announcement.target_type == AnnouncementTarget.partners:
            rows = await self._session.scalars(
                select(User.id).where(
                    User.deleted_at.is_(None),
                    User.role.in_((UserRole.partner, UserRole.partner_staff)),
                ),
            )
            return list(rows.all())
        if announcement.target_type == AnnouncementTarget.specific_laundries:
            ids: set[UUID] = set()
            for lid in announcement.target_laundry_ids:
                owner = await self._session.scalar(select(Laundry.owner_user_id).where(Laundry.id == lid))
                if owner:
                    ids.add(owner)
                staff_rows = await self._session.scalars(
                    select(PartnerStaff.user_id).where(PartnerStaff.laundry_id == lid, PartnerStaff.is_active.is_(True)),
                )
                ids.update(staff_rows.all())
                customer_rows = await self._session.scalars(
                    select(Order.user_id).where(
                        Order.laundry_id == lid,
                        Order.deleted_at.is_(None),
                        Order.status != OrderStatus.cancelled,
                    ).distinct(),
                )
                ids.update(customer_rows.all())
            return list(ids)
        if announcement.target_type == AnnouncementTarget.specific_cities:
            normalized = [c.strip().lower() for c in announcement.target_cities if c.strip()]
            ids: set[UUID] = set()
            laundry_owners = await self._session.scalars(
                select(Laundry.owner_user_id).where(
                    Laundry.deleted_at.is_(None),
                    func.lower(Laundry.city).in_(normalized),
                ),
            )
            ids.update(laundry_owners.all())
            staff_users = await self._session.scalars(
                select(PartnerStaff.user_id)
                .join(Laundry, Laundry.id == PartnerStaff.laundry_id)
                .where(func.lower(Laundry.city).in_(normalized), PartnerStaff.is_active.is_(True)),
            )
            ids.update(staff_users.all())
            address_users = await self._session.scalars(
                select(UserAddress.user_id).where(func.lower(UserAddress.city).in_(normalized)),
            )
            ids.update(address_users.all())
            order_users = await self._session.scalars(
                select(Order.user_id)
                .join(Laundry, Laundry.id == Order.laundry_id)
                .where(
                    Order.deleted_at.is_(None),
                    Order.status != OrderStatus.cancelled,
                    func.lower(Laundry.city).in_(normalized),
                ).distinct(),
            )
            ids.update(order_users.all())
            return list(ids)
        return []
