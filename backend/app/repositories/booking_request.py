"""Booking request persistence — admin/partner inbox + phone CRM."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

from sqlalchemy import Select, and_, case, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.booking_request import (
    BOOKING_REQUEST_OPEN_STATUSES,
    BOOKING_REQUEST_TERMINAL_STATUSES,
    BookingRequest,
    BookingRequestEvent,
    BookingRequestMessage,
)
from app.models.enums import (
    BookingRequestEventType,
    BookingRequestMessageVisibility,
    BookingRequestPriority,
    BookingRequestSource,
    BookingRequestStatus,
)
from app.utils.phone import normalize_phone, validate_strict_indian_mobile

_PRE_CONTACT_STATUSES = (
    BookingRequestStatus.new,
    BookingRequestStatus.reviewing,
    BookingRequestStatus.assigned,
)


class BookingRequestRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, row: BookingRequest) -> BookingRequest:
        self._session.add(row)
        await self._session.flush()
        return row

    async def get_by_id(
        self,
        booking_request_id: UUID,
        *,
        include_deleted: bool = False,
    ) -> BookingRequest | None:
        stmt = select(BookingRequest).where(BookingRequest.id == booking_request_id)
        if not include_deleted:
            stmt = stmt.where(BookingRequest.deleted_at.is_(None))
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_public_code(
        self,
        public_code: str,
        *,
        include_deleted: bool = False,
    ) -> BookingRequest | None:
        stmt = select(BookingRequest).where(BookingRequest.public_code == public_code)
        if not include_deleted:
            stmt = stmt.where(BookingRequest.deleted_at.is_(None))
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    def _apply_list_filters(
        self,
        stmt: Select[Any],
        *,
        status: BookingRequestStatus | None = None,
        statuses: list[BookingRequestStatus] | None = None,
        priority: BookingRequestPriority | None = None,
        assigned_laundry_id: UUID | None = None,
        unassigned: bool = False,
        phone: str | None = None,
        q: str | None = None,
        source: BookingRequestSource | None = None,
        include_deleted: bool = False,
        open_only: bool = False,
        created_from: datetime | None = None,
        created_to: datetime | None = None,
    ) -> Select[Any]:
        if not include_deleted:
            stmt = stmt.where(BookingRequest.deleted_at.is_(None))
        if status is not None:
            stmt = stmt.where(BookingRequest.status == status)
        if statuses:
            stmt = stmt.where(BookingRequest.status.in_(statuses))
        if open_only:
            stmt = stmt.where(BookingRequest.status.in_(BOOKING_REQUEST_OPEN_STATUSES))
        if priority is not None:
            stmt = stmt.where(BookingRequest.priority == priority)
        if assigned_laundry_id is not None:
            stmt = stmt.where(BookingRequest.assigned_laundry_id == assigned_laundry_id)
        if unassigned:
            stmt = stmt.where(BookingRequest.assigned_laundry_id.is_(None))
        if phone:
            phone_e164 = normalize_phone(phone)
            stmt = stmt.where(BookingRequest.phone_e164 == phone_e164)
        if source is not None:
            stmt = stmt.where(BookingRequest.source == source)
        if created_from is not None:
            stmt = stmt.where(BookingRequest.created_at >= created_from)
        if created_to is not None:
            stmt = stmt.where(BookingRequest.created_at <= created_to)
        if q:
            pattern = f"%{q.strip()}%"
            stmt = stmt.where(
                or_(
                    BookingRequest.public_code.ilike(pattern),
                    BookingRequest.customer_name.ilike(pattern),
                    BookingRequest.phone_e164.ilike(pattern),
                ),
            )
        return stmt

    async def list(
        self,
        *,
        status: BookingRequestStatus | None = None,
        statuses: list[BookingRequestStatus] | None = None,
        priority: BookingRequestPriority | None = None,
        assigned_laundry_id: UUID | None = None,
        unassigned: bool = False,
        phone: str | None = None,
        q: str | None = None,
        source: BookingRequestSource | None = None,
        include_deleted: bool = False,
        open_only: bool = False,
        created_from: datetime | None = None,
        created_to: datetime | None = None,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "created_at",
        sort_dir: str = "desc",
    ) -> tuple[list[BookingRequest], int]:
        safe_page = max(1, page)
        safe_size = min(max(1, page_size), 100)

        base = select(BookingRequest)
        base = self._apply_list_filters(
            base,
            status=status,
            statuses=statuses,
            priority=priority,
            assigned_laundry_id=assigned_laundry_id,
            unassigned=unassigned,
            phone=phone,
            q=q,
            source=source,
            include_deleted=include_deleted,
            open_only=open_only,
            created_from=created_from,
            created_to=created_to,
        )

        count_stmt = select(func.count()).select_from(base.order_by(None).subquery())
        total = int(await self._session.scalar(count_stmt) or 0)

        if sort_by == "sla":
            now = datetime.now(UTC)
            aging_cut = now - timedelta(minutes=15)
            overdue_cut = now - timedelta(minutes=60)
            sla_rank = case(
                (
                    and_(
                        BookingRequest.status.in_(_PRE_CONTACT_STATUSES),
                        BookingRequest.created_at < overdue_cut,
                    ),
                    0,
                ),
                (
                    and_(
                        BookingRequest.status.in_(_PRE_CONTACT_STATUSES),
                        BookingRequest.created_at < aging_cut,
                    ),
                    1,
                ),
                (BookingRequest.status.in_(_PRE_CONTACT_STATUSES), 2),
                else_=3,
            )
            order_clauses = (sla_rank.asc(), BookingRequest.created_at.desc(), BookingRequest.id.desc())
        else:
            sort_map = {
                "created_at": BookingRequest.created_at,
                "updated_at": BookingRequest.updated_at,
                "last_response_at": BookingRequest.last_response_at,
                "priority": BookingRequest.priority,
                "status": BookingRequest.status,
            }
            sort_col = sort_map.get(sort_by, BookingRequest.created_at)
            primary = sort_col.asc() if sort_dir.lower() == "asc" else sort_col.desc()
            order_clauses = (primary, BookingRequest.id.desc())

        rows = await self._session.scalars(
            base.order_by(*order_clauses)
            .offset((safe_page - 1) * safe_size)
            .limit(safe_size),
        )
        return list(rows.all()), total

    async def update(
        self,
        row: BookingRequest,
        *,
        fields: dict[str, Any],
        actor_user_id: UUID | None = None,
        record_event: bool = True,
    ) -> BookingRequest:
        from_status = row.status
        for key, value in fields.items():
            if not hasattr(row, key):
                raise AttributeError(f"BookingRequest has no field '{key}'")
            setattr(row, key, value)

        if "status" in fields:
            new_status = fields["status"]
            if new_status in BOOKING_REQUEST_TERMINAL_STATUSES and row.closed_at is None:
                row.closed_at = datetime.now(UTC)
            elif new_status not in BOOKING_REQUEST_TERMINAL_STATUSES:
                row.closed_at = None
            if record_event and new_status != from_status:
                await self.add_event(
                    BookingRequestEvent(
                        booking_request_id=row.id,
                        event_type=BookingRequestEventType.status_changed,
                        actor_user_id=actor_user_id,
                        from_status=from_status,
                        to_status=new_status,
                    ),
                )
        elif record_event:
            await self.add_event(
                BookingRequestEvent(
                    booking_request_id=row.id,
                    event_type=BookingRequestEventType.updated,
                    actor_user_id=actor_user_id,
                    payload={"fields": sorted(fields.keys())},
                ),
            )

        await self._session.flush()
        return row

    async def soft_delete(
        self,
        row: BookingRequest,
        *,
        actor_user_id: UUID | None = None,
    ) -> BookingRequest:
        if row.deleted_at is not None:
            return row
        row.deleted_at = datetime.now(UTC)
        await self.add_event(
            BookingRequestEvent(
                booking_request_id=row.id,
                event_type=BookingRequestEventType.soft_deleted,
                actor_user_id=actor_user_id,
            ),
        )
        await self._session.flush()
        return row

    async def restore(
        self,
        row: BookingRequest,
        *,
        actor_user_id: UUID | None = None,
    ) -> BookingRequest:
        if row.deleted_at is None:
            return row
        row.deleted_at = None
        await self.add_event(
            BookingRequestEvent(
                booking_request_id=row.id,
                event_type=BookingRequestEventType.restored,
                actor_user_id=actor_user_id,
            ),
        )
        await self._session.flush()
        return row

    async def assign(
        self,
        row: BookingRequest,
        *,
        laundry_id: UUID,
        assigned_by_user_id: UUID | None,
        actor_user_id: UUID | None = None,
    ) -> BookingRequest:
        """Assign (or re-assign) a laundry. Same laundry is a no-op."""
        if row.assigned_laundry_id == laundry_id:
            return row

        from_laundry = row.assigned_laundry_id
        from_status = row.status
        now = datetime.now(UTC)
        row.assigned_laundry_id = laundry_id
        row.assigned_at = now
        row.assigned_by_user_id = assigned_by_user_id
        if row.status in (
            BookingRequestStatus.new,
            BookingRequestStatus.reviewing,
            BookingRequestStatus.assigned,
        ):
            row.status = BookingRequestStatus.assigned
            row.closed_at = None

        event_type = (
            BookingRequestEventType.transferred
            if from_laundry is not None
            else BookingRequestEventType.assigned
        )
        await self.add_event(
            BookingRequestEvent(
                booking_request_id=row.id,
                event_type=event_type,
                actor_user_id=actor_user_id or assigned_by_user_id,
                from_status=from_status,
                to_status=row.status,
                from_laundry_id=from_laundry,
                to_laundry_id=laundry_id,
            ),
        )
        await self._session.flush()
        return row

    async def transfer(
        self,
        row: BookingRequest,
        *,
        to_laundry_id: UUID,
        assigned_by_user_id: UUID | None,
        actor_user_id: UUID | None = None,
    ) -> BookingRequest:
        """Transfer to another laundry (admin). Same as assign when already linked."""
        return await self.assign(
            row,
            laundry_id=to_laundry_id,
            assigned_by_user_id=assigned_by_user_id,
            actor_user_id=actor_user_id,
        )

    async def release(
        self,
        row: BookingRequest,
        *,
        actor_user_id: UUID | None = None,
    ) -> BookingRequest:
        """Unassign laundry and return request to admin inbox (`reviewing`)."""
        if row.assigned_laundry_id is None and row.status == BookingRequestStatus.reviewing:
            return row

        from_laundry = row.assigned_laundry_id
        from_status = row.status
        row.assigned_laundry_id = None
        row.assigned_at = None
        row.assigned_by_user_id = None
        row.status = BookingRequestStatus.reviewing
        row.closed_at = None
        await self.add_event(
            BookingRequestEvent(
                booking_request_id=row.id,
                event_type=BookingRequestEventType.released,
                actor_user_id=actor_user_id,
                from_status=from_status,
                to_status=row.status,
                from_laundry_id=from_laundry,
                to_laundry_id=None,
            ),
        )
        await self._session.flush()
        return row

    async def list_by_phone(
        self,
        phone: str,
        *,
        include_deleted: bool = False,
        assigned_laundry_id: UUID | None = None,
        laundry_history_id: UUID | None = None,
        limit: int = 50,
    ) -> list[BookingRequest]:
        """CRM timeline for a phone — newest first. Accepts raw or E.164 input.

        When ``laundry_history_id`` is set, include currently assigned rows **and**
        any request that was assigned/transferred/released involving that laundry.
        """
        phone_e164 = validate_strict_indian_mobile(phone)
        stmt = (
            select(BookingRequest)
            .where(BookingRequest.phone_e164 == phone_e164)
            .order_by(BookingRequest.created_at.desc())
            .limit(limit)
        )
        if not include_deleted:
            stmt = stmt.where(BookingRequest.deleted_at.is_(None))
        if laundry_history_id is not None:
            event_ids = select(BookingRequestEvent.booking_request_id).where(
                or_(
                    BookingRequestEvent.from_laundry_id == laundry_history_id,
                    BookingRequestEvent.to_laundry_id == laundry_history_id,
                ),
            )
            stmt = stmt.where(
                or_(
                    BookingRequest.assigned_laundry_id == laundry_history_id,
                    BookingRequest.id.in_(event_ids),
                ),
            )
        elif assigned_laundry_id is not None:
            stmt = stmt.where(BookingRequest.assigned_laundry_id == assigned_laundry_id)
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def list_open_ids_by_phone(self, phone_e164: str) -> list[UUID]:
        """Open (non-terminal, non-deleted) request ids for duplicate warning."""
        result = await self._session.execute(
            select(BookingRequest.id)
            .where(
                BookingRequest.phone_e164 == phone_e164,
                BookingRequest.deleted_at.is_(None),
                BookingRequest.status.in_(BOOKING_REQUEST_OPEN_STATUSES),
            )
            .order_by(BookingRequest.created_at.desc()),
        )
        return list(result.scalars().all())

    async def count_recent_by_phone(self, phone_e164: str, since: datetime) -> int:
        result = await self._session.scalar(
            select(func.count())
            .select_from(BookingRequest)
            .where(
                BookingRequest.phone_e164 == phone_e164,
                BookingRequest.created_at >= since,
            ),
        )
        return int(result or 0)

    async def count_recent_by_ip(self, client_ip: str, since: datetime) -> int:
        result = await self._session.scalar(
            select(func.count())
            .select_from(BookingRequest)
            .where(
                BookingRequest.client_ip == client_ip,
                BookingRequest.created_at >= since,
            ),
        )
        return int(result or 0)

    async def inbox_counts(self, *, assigned_laundry_id: UUID | None = None) -> dict[str, int]:
        """Open inbox counters for admin/partner meta badges."""
        now = datetime.now(UTC)
        overdue_cut = now - timedelta(minutes=60)

        base_filters = [
            BookingRequest.deleted_at.is_(None),
            BookingRequest.status.in_(BOOKING_REQUEST_OPEN_STATUSES),
        ]
        if assigned_laundry_id is not None:
            base_filters.append(BookingRequest.assigned_laundry_id == assigned_laundry_id)

        new_count = int(
            await self._session.scalar(
                select(func.count())
                .select_from(BookingRequest)
                .where(*base_filters, BookingRequest.status == BookingRequestStatus.new),
            )
            or 0,
        )
        reviewing_count = int(
            await self._session.scalar(
                select(func.count())
                .select_from(BookingRequest)
                .where(*base_filters, BookingRequest.status == BookingRequestStatus.reviewing),
            )
            or 0,
        )
        overdue_count = int(
            await self._session.scalar(
                select(func.count())
                .select_from(BookingRequest)
                .where(
                    *base_filters,
                    BookingRequest.status.in_(_PRE_CONTACT_STATUSES),
                    BookingRequest.created_at < overdue_cut,
                ),
            )
            or 0,
        )
        return {"new": new_count, "reviewing": reviewing_count, "overdue": overdue_count}

    async def add_message(
        self,
        message: BookingRequestMessage,
        *,
        touch_parent: bool = True,
    ) -> BookingRequestMessage:
        self._session.add(message)
        await self._session.flush()

        if touch_parent:
            parent = await self.get_by_id(message.booking_request_id, include_deleted=True)
            if parent is not None:
                if message.visibility == BookingRequestMessageVisibility.customer_facing:
                    parent.last_response_at = datetime.now(UTC)
                    if parent.status in _PRE_CONTACT_STATUSES:
                        from_status = parent.status
                        parent.status = BookingRequestStatus.contacted
                        await self.add_event(
                            BookingRequestEvent(
                                booking_request_id=parent.id,
                                event_type=BookingRequestEventType.responded,
                                actor_user_id=message.author_user_id,
                                from_status=from_status,
                                to_status=parent.status,
                            ),
                        )
                    else:
                        await self.add_event(
                            BookingRequestEvent(
                                booking_request_id=parent.id,
                                event_type=BookingRequestEventType.responded,
                                actor_user_id=message.author_user_id,
                            ),
                        )
                else:
                    await self.add_event(
                        BookingRequestEvent(
                            booking_request_id=parent.id,
                            event_type=BookingRequestEventType.note_added,
                            actor_user_id=message.author_user_id,
                        ),
                    )
                await self._session.flush()
        return message

    async def list_messages(
        self,
        booking_request_id: UUID,
        *,
        limit: int = 50,
        visibility: BookingRequestMessageVisibility | None = None,
    ) -> list[BookingRequestMessage]:
        stmt = (
            select(BookingRequestMessage)
            .where(BookingRequestMessage.booking_request_id == booking_request_id)
            .order_by(BookingRequestMessage.created_at.asc())
            .limit(limit)
        )
        if visibility is not None:
            stmt = stmt.where(BookingRequestMessage.visibility == visibility)
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def add_event(self, event: BookingRequestEvent) -> BookingRequestEvent:
        self._session.add(event)
        await self._session.flush()
        return event

    async def list_events(
        self,
        booking_request_id: UUID,
        *,
        limit: int = 50,
    ) -> list[BookingRequestEvent]:
        result = await self._session.execute(
            select(BookingRequestEvent)
            .where(BookingRequestEvent.booking_request_id == booking_request_id)
            .order_by(BookingRequestEvent.created_at.asc())
            .limit(limit),
        )
        return list(result.scalars().all())
