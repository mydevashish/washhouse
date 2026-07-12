"""Chain-of-custody event recording and retrieval."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthorizationError, NotFoundError
from app.models.custody_event import OrderCustodyEvent
from app.models.enums import CustodyActorRole, CustodyEventType, OrderStatus
from app.repositories.custody_event import CustodyEventRepository
from app.repositories.laundry import LaundryRepository
from app.repositories.order import OrderRepository
from app.repositories.user import UserRepository
from app.schemas.custody_event import CUSTODY_EVENT_LABELS, CustodyEventResponse, CustodyTimelineResponse

STATUS_TO_CUSTODY: dict[OrderStatus, CustodyEventType] = {
    OrderStatus.pickup_assigned: CustodyEventType.pickup_assigned,
    OrderStatus.picked_up: CustodyEventType.pickup_completed,
    OrderStatus.washing: CustodyEventType.washing_started,
    OrderStatus.ironing: CustodyEventType.ironing_started,
    OrderStatus.ready: CustodyEventType.packaging_completed,
    OrderStatus.out_for_delivery: CustodyEventType.delivery_assigned,
    OrderStatus.delivered: CustodyEventType.delivered,
    OrderStatus.cancelled: CustodyEventType.order_cancelled,
}


class CustodyEventService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._events = CustodyEventRepository(session)
        self._orders = OrderRepository(session)
        self._laundries = LaundryRepository(session)
        self._users = UserRepository(session)

    async def record(
        self,
        order_id: UUID,
        event_type: CustodyEventType,
        *,
        actor_user_id: UUID | None = None,
        actor_role: CustodyActorRole,
        metadata: dict[str, Any] | None = None,
    ) -> OrderCustodyEvent:
        row = OrderCustodyEvent(
            order_id=order_id,
            event_type=event_type,
            actor_user_id=actor_user_id,
            actor_role=actor_role,
            metadata_=metadata,
        )
        return await self._events.save(row)

    async def record_status_change(
        self,
        order_id: UUID,
        status: OrderStatus,
        *,
        actor_user_id: UUID | None,
        actor_role: CustodyActorRole,
        metadata: dict[str, Any] | None = None,
    ) -> OrderCustodyEvent | None:
        event_type = STATUS_TO_CUSTODY.get(status)
        if not event_type:
            return None
        return await self.record(
            order_id,
            event_type,
            actor_user_id=actor_user_id,
            actor_role=actor_role,
            metadata=metadata,
        )

    async def get_timeline_for_customer(self, user_id: UUID, order_id: UUID) -> CustodyTimelineResponse:
        order = await self._orders.get_by_id(order_id)
        if not order or order.user_id != user_id:
            raise NotFoundError("Order not found")
        return await self._build_timeline(order_id)

    async def get_timeline_for_partner(self, partner_user_id: UUID, order_id: UUID) -> CustodyTimelineResponse:
        laundry = await self._laundries.get_by_owner(partner_user_id)
        if not laundry:
            raise NotFoundError("Partner laundry not found")
        order = await self._orders.get_by_id(order_id)
        if not order or order.laundry_id != laundry.id:
            raise NotFoundError("Order not found")
        return await self._build_timeline(order_id)

    async def get_timeline_for_admin(self, order_id: UUID) -> CustodyTimelineResponse:
        order = await self._orders.get_by_id(order_id)
        if not order:
            raise NotFoundError("Order not found")
        return await self._build_timeline(order_id)

    async def _build_timeline(self, order_id: UUID) -> CustodyTimelineResponse:
        rows = await self._events.list_by_order(order_id)
        actor_ids = {r.actor_user_id for r in rows if r.actor_user_id}
        names: dict[UUID, str] = {}
        for uid in actor_ids:
            user = await self._users.get_by_id(uid)
            if user:
                names[uid] = user.full_name or user.email

        events = [
            CustodyEventResponse(
                id=row.id,
                order_id=row.order_id,
                event_type=row.event_type,
                label=CUSTODY_EVENT_LABELS.get(row.event_type, row.event_type.value.replace("_", " ").title()),
                actor_user_id=row.actor_user_id,
                actor_role=row.actor_role,
                actor_name=names.get(row.actor_user_id) if row.actor_user_id else None,
                metadata=row.metadata_,
                created_at=row.created_at,
            )
            for row in rows
        ]
        return CustodyTimelineResponse(order_id=order_id, events=events)

    async def _assert_can_view(self, order, *, user_id: UUID, role: str) -> None:
        if role in ("admin", "super_admin"):
            return
        if role == "customer" and order.user_id == user_id:
            return
        if role == "partner":
            laundry = await self._laundries.get_by_owner(user_id)
            if laundry and order.laundry_id == laundry.id:
                return
        raise AuthorizationError()
