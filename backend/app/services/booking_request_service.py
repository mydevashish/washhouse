"""Booking request business logic — public create, admin/partner inbox, phone CRM."""

from __future__ import annotations

import secrets
from datetime import UTC, datetime, timedelta
from urllib.parse import quote
from uuid import UUID

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    BookingRequestAlreadyTerminalError,
    BookingRequestInvalidTransitionError,
    BookingRequestNotFoundError,
    ErrorDetail,
    NotFoundError,
    RateLimitError,
    ValidationError,
)
from app.models.booking_request import (
    BOOKING_REQUEST_TERMINAL_STATUSES,
    BookingRequest,
    BookingRequestEvent,
    BookingRequestMessage,
)
from app.models.enums import (
    BookingRequestCreatedByRole,
    BookingRequestEventType,
    BookingRequestMessageAuthorRole,
    BookingRequestMessageVisibility,
    BookingRequestPreferredTime,
    BookingRequestPriority,
    BookingRequestServiceType,
    BookingRequestSource,
    BookingRequestStatus,
    LaundryStatus,
    OrderSource,
)
from app.models.laundry import Laundry
from app.repositories.booking_request import BookingRequestRepository
from app.repositories.laundry import LaundryRepository
from app.schemas.booking_request import (
    BookingRequestAdminCreate,
    BookingRequestAssign,
    BookingRequestConvert,
    BookingRequestConvertResult,
    BookingRequestDetailOut,
    BookingRequestEventOut,
    BookingRequestLaundrySuggestion,
    BookingRequestMessageCreate,
    BookingRequestMessageOut,
    BookingRequestOut,
    BookingRequestPartnerCreate,
    BookingRequestPhoneTimelineOut,
    BookingRequestPublicCreate,
    BookingRequestPublicCreated,
    BookingRequestSuggestLaundriesOut,
    BookingRequestUpdate,
)
from app.services.customer_desk_service import CustomerDeskService
from app.services.notifications.booking_request_notifier import BookingRequestNotifier
from app.utils.phone import phone_digits, validate_strict_indian_mobile

log = structlog.get_logger(__name__)

PUBLIC_PHONE_LIMIT = 3
PUBLIC_IP_LIMIT = 5
PUBLIC_WINDOW = timedelta(hours=1)

_SERVICE_LABELS = {
    BookingRequestServiceType.wash_fold: "Wash & Fold",
    BookingRequestServiceType.wash_iron: "Wash & Iron",
    BookingRequestServiceType.premium_laundry: "Premium Laundry",
    BookingRequestServiceType.dry_clean: "Dry Clean",
    BookingRequestServiceType.shoe_cleaning: "Shoe Cleaning",
    BookingRequestServiceType.curtain_cleaning: "Curtain Cleaning",
    BookingRequestServiceType.other: "Other",
}

_TIME_LABELS = {
    BookingRequestPreferredTime.morning: "Morning (8 AM – 12 PM)",
    BookingRequestPreferredTime.afternoon: "Afternoon (12 PM – 5 PM)",
    BookingRequestPreferredTime.evening: "Evening (5 PM – 8 PM)",
    BookingRequestPreferredTime.flexible: "Flexible",
}

_ADMIN_TRANSITIONS: dict[BookingRequestStatus, set[BookingRequestStatus]] = {
    BookingRequestStatus.new: {
        BookingRequestStatus.reviewing,
        BookingRequestStatus.assigned,
        BookingRequestStatus.contacted,
        BookingRequestStatus.declined,
        BookingRequestStatus.cancelled,
        BookingRequestStatus.expired,
    },
    BookingRequestStatus.reviewing: {
        BookingRequestStatus.assigned,
        BookingRequestStatus.contacted,
        BookingRequestStatus.declined,
        BookingRequestStatus.cancelled,
        BookingRequestStatus.expired,
    },
    BookingRequestStatus.assigned: {
        BookingRequestStatus.reviewing,
        BookingRequestStatus.contacted,
        BookingRequestStatus.confirmed,
        BookingRequestStatus.declined,
        BookingRequestStatus.cancelled,
        BookingRequestStatus.expired,
        BookingRequestStatus.assigned,
    },
    BookingRequestStatus.contacted: {
        BookingRequestStatus.confirmed,
        BookingRequestStatus.declined,
        BookingRequestStatus.cancelled,
        BookingRequestStatus.expired,
        BookingRequestStatus.reviewing,
    },
    BookingRequestStatus.confirmed: {
        BookingRequestStatus.converted_to_order,
        BookingRequestStatus.cancelled,
    },
}

_PARTNER_TRANSITIONS: dict[BookingRequestStatus, set[BookingRequestStatus]] = {
    BookingRequestStatus.assigned: {
        BookingRequestStatus.contacted,
        BookingRequestStatus.confirmed,
        BookingRequestStatus.declined,
        BookingRequestStatus.cancelled,
    },
    BookingRequestStatus.contacted: {
        BookingRequestStatus.confirmed,
        BookingRequestStatus.declined,
        BookingRequestStatus.cancelled,
    },
    BookingRequestStatus.confirmed: {
        BookingRequestStatus.cancelled,
    },
}


class BookingRequestService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = BookingRequestRepository(session)
        self._laundries = LaundryRepository(session)
        self._notifier = BookingRequestNotifier(session)

    # ---------- Public ----------
    async def create_public(
        self,
        payload: BookingRequestPublicCreate,
        *,
        client_ip: str | None,
    ) -> tuple[BookingRequestPublicCreated, bool, list[UUID]]:
        await self._enforce_public_rate_limits(payload.phone, client_ip)
        open_ids = await self._repo.list_open_ids_by_phone(payload.phone)

        row = BookingRequest(
            public_code=await self._allocate_public_code(),
            customer_name=payload.customer_name,
            phone_e164=payload.phone,
            service_type=payload.service_type,
            preferred_time_window=payload.preferred_time_window,
            notes=payload.notes,
            address_text=payload.address_text,
            city=payload.city,
            pincode=payload.pincode,
            source=payload.source,
            status=BookingRequestStatus.new,
            priority=BookingRequestPriority.normal,
            assigned_laundry_id=None,
            created_by_role=BookingRequestCreatedByRole.public,
            created_by_user_id=None,
            client_ip=client_ip,
        )
        saved = await self._repo.create(row)
        await self._repo.add_event(
            BookingRequestEvent(
                booking_request_id=saved.id,
                event_type=BookingRequestEventType.created,
                to_status=saved.status,
                payload={"source": saved.source.value},
            ),
        )
        log.info(
            "booking_request.created",
            booking_request_id=str(saved.id),
            public_code=saved.public_code,
            source=saved.source.value,
            role="public",
        )
        await self._notifier.notify_admins_new_request(saved)
        return (
            BookingRequestPublicCreated(
                id=saved.id,
                public_code=saved.public_code,
                status=saved.status,
            ),
            bool(open_ids),
            open_ids,
        )

    # ---------- Admin ----------
    async def admin_list(
        self,
        *,
        page: int = 1,
        page_size: int = 20,
        status: BookingRequestStatus | None = None,
        statuses: list[BookingRequestStatus] | None = None,
        priority: BookingRequestPriority | None = None,
        assigned_laundry_id: UUID | None = None,
        unassigned: bool = False,
        phone: str | None = None,
        q: str | None = None,
        source: BookingRequestSource | None = None,
        include_deleted: bool = False,
        created_from: datetime | None = None,
        created_to: datetime | None = None,
        sort: str = "sla",
    ) -> tuple[list[BookingRequestOut], int, dict[str, int]]:
        sort_by, sort_dir = self._parse_sort(sort)
        rows, total = await self._repo.list(
            status=status,
            statuses=statuses,
            priority=priority,
            assigned_laundry_id=assigned_laundry_id,
            unassigned=unassigned,
            phone=phone,
            q=q,
            source=source,
            include_deleted=include_deleted,
            created_from=created_from,
            created_to=created_to,
            page=page,
            page_size=page_size,
            sort_by=sort_by,
            sort_dir=sort_dir,
        )
        laundry_names = await self._laundry_names({r.assigned_laundry_id for r in rows})
        items = [await self._to_out(r, laundry_names=laundry_names) for r in rows]
        inbox = await self._repo.inbox_counts()
        return items, total, inbox

    async def admin_create(
        self,
        payload: BookingRequestAdminCreate,
        *,
        admin_user_id: UUID,
    ) -> BookingRequestOut:
        open_ids = await self._repo.list_open_ids_by_phone(payload.phone)
        assigned_laundry_id = payload.assigned_laundry_id
        if assigned_laundry_id is not None:
            await self._require_assignable_laundry(assigned_laundry_id)

        initial_status = payload.status
        if initial_status is None:
            initial_status = (
                BookingRequestStatus.assigned
                if assigned_laundry_id is not None
                else BookingRequestStatus.new
            )
        if assigned_laundry_id is not None and initial_status == BookingRequestStatus.new:
            initial_status = BookingRequestStatus.assigned

        now = datetime.now(UTC)
        row = BookingRequest(
            public_code=await self._allocate_public_code(),
            customer_name=payload.customer_name,
            phone_e164=payload.phone,
            service_type=payload.service_type,
            preferred_time_window=payload.preferred_time_window,
            notes=payload.notes,
            address_text=payload.address_text,
            city=payload.city,
            pincode=payload.pincode,
            source=BookingRequestSource.admin_created,
            status=initial_status,
            priority=payload.priority,
            assigned_laundry_id=assigned_laundry_id,
            assigned_at=now if assigned_laundry_id else None,
            assigned_by_user_id=admin_user_id if assigned_laundry_id else None,
            created_by_role=BookingRequestCreatedByRole.admin,
            created_by_user_id=admin_user_id,
        )
        saved = await self._repo.create(row)
        await self._repo.add_event(
            BookingRequestEvent(
                booking_request_id=saved.id,
                event_type=BookingRequestEventType.created,
                actor_user_id=admin_user_id,
                to_status=saved.status,
                to_laundry_id=assigned_laundry_id,
                payload={"source": saved.source.value, "open_duplicate_ids": [str(i) for i in open_ids]},
            ),
        )
        log.info(
            "booking_request.created",
            booking_request_id=str(saved.id),
            public_code=saved.public_code,
            role="admin",
        )
        if assigned_laundry_id is not None:
            laundry = await self._laundries.get_by_id(assigned_laundry_id)
            if laundry is not None:
                await self._notifier.notify_partner_assigned(saved, laundry)
        return await self._to_out(saved, open_duplicate_ids=open_ids)

    async def admin_get(self, booking_request_id: UUID) -> BookingRequestDetailOut:
        row = await self._require_row(booking_request_id, include_deleted=True)
        return await self._to_detail(row)

    async def admin_update(
        self,
        booking_request_id: UUID,
        payload: BookingRequestUpdate,
        *,
        admin_user_id: UUID,
    ) -> BookingRequestOut:
        row = await self._require_row(booking_request_id)
        return await self._apply_update(row, payload, actor_user_id=admin_user_id, role="admin")

    async def admin_soft_delete(self, booking_request_id: UUID, *, admin_user_id: UUID) -> BookingRequestOut:
        row = await self._require_row(booking_request_id, include_deleted=True)
        saved = await self._repo.soft_delete(row, actor_user_id=admin_user_id)
        return await self._to_out(saved)

    async def admin_restore(self, booking_request_id: UUID, *, admin_user_id: UUID) -> BookingRequestOut:
        row = await self._require_row(booking_request_id, include_deleted=True)
        saved = await self._repo.restore(row, actor_user_id=admin_user_id)
        return await self._to_out(saved)

    async def admin_claim(self, booking_request_id: UUID, *, admin_user_id: UUID) -> BookingRequestOut:
        row = await self._require_row(booking_request_id)
        if row.status == BookingRequestStatus.reviewing:
            return await self._to_out(row)
        if row.status != BookingRequestStatus.new:
            raise BookingRequestInvalidTransitionError(
                f"Cannot claim booking request in status '{row.status.value}'",
            )
        saved = await self._repo.update(
            row,
            fields={"status": BookingRequestStatus.reviewing},
            actor_user_id=admin_user_id,
        )
        return await self._to_out(saved)

    async def admin_assign(
        self,
        booking_request_id: UUID,
        payload: BookingRequestAssign,
        *,
        admin_user_id: UUID,
    ) -> BookingRequestOut:
        row = await self._require_row(booking_request_id)
        if row.status in BOOKING_REQUEST_TERMINAL_STATUSES:
            raise BookingRequestAlreadyTerminalError()
        laundry = await self._require_assignable_laundry(payload.laundry_id)
        saved = await self._repo.assign(
            row,
            laundry_id=payload.laundry_id,
            assigned_by_user_id=admin_user_id,
            actor_user_id=admin_user_id,
        )
        if payload.note:
            await self._repo.add_message(
                BookingRequestMessage(
                    booking_request_id=saved.id,
                    author_user_id=admin_user_id,
                    author_role=BookingRequestMessageAuthorRole.admin,
                    visibility=BookingRequestMessageVisibility.internal,
                    body=payload.note,
                ),
            )
            saved = await self._require_row(saved.id)
        log.info(
            "booking_request.assigned",
            booking_request_id=str(saved.id),
            laundry_id=str(payload.laundry_id),
        )
        await self._notifier.notify_partner_assigned(saved, laundry)
        return await self._to_out(saved)

    async def admin_suggest_laundries(
        self,
        booking_request_id: UUID,
        *,
        limit: int = 5,
    ) -> BookingRequestSuggestLaundriesOut:
        """Rank active laundries: city/pincode match → rating → recently updated."""
        row = await self._require_row(booking_request_id)
        candidates = await self._laundries.list_approved(limit=80, offset=0)
        scored = [self._score_laundry_suggestion(row, laundry) for laundry in candidates]
        scored.sort(key=lambda s: (-s.score, -s.avg_rating, s.name.lower()))
        return BookingRequestSuggestLaundriesOut(suggestions=scored[: max(1, min(limit, 10))])

    async def admin_release(self, booking_request_id: UUID, *, admin_user_id: UUID) -> BookingRequestOut:
        row = await self._require_row(booking_request_id)
        if row.status in BOOKING_REQUEST_TERMINAL_STATUSES:
            raise BookingRequestAlreadyTerminalError()
        saved = await self._repo.release(row, actor_user_id=admin_user_id)
        return await self._to_out(saved)

    async def admin_add_message(
        self,
        booking_request_id: UUID,
        payload: BookingRequestMessageCreate,
        *,
        admin_user_id: UUID,
    ) -> BookingRequestDetailOut:
        row = await self._require_row(booking_request_id)
        await self._add_message(
            row,
            payload,
            author_user_id=admin_user_id,
            author_role=BookingRequestMessageAuthorRole.admin,
            allow_customer_facing_on_terminal=True,
        )
        refreshed = await self._require_row(booking_request_id)
        if payload.visibility == BookingRequestMessageVisibility.customer_facing:
            log.info("booking_request.contacted", booking_request_id=str(refreshed.id), role="admin")
        return await self._to_detail(refreshed)

    async def admin_by_phone(self, phone: str) -> BookingRequestPhoneTimelineOut:
        phone_e164 = validate_strict_indian_mobile(phone)
        rows = await self._repo.list_by_phone(phone_e164, include_deleted=False, limit=50)
        return await self._phone_timeline(phone_e164, rows)

    async def admin_convert(
        self,
        booking_request_id: UUID,
        payload: BookingRequestConvert,
        *,
        admin_user_id: UUID,
    ) -> BookingRequestConvertResult:
        row = await self._require_row(booking_request_id)
        return await self._convert(
            row,
            payload,
            actor_user_id=admin_user_id,
            order_source=OrderSource.assisted_admin,
            force=payload.force,
            partner_laundry_id=None,
        )

    # ---------- Partner ----------
    async def partner_list(
        self,
        partner_user_id: UUID,
        *,
        page: int = 1,
        page_size: int = 20,
        status: BookingRequestStatus | None = None,
        statuses: list[BookingRequestStatus] | None = None,
        priority: BookingRequestPriority | None = None,
        phone: str | None = None,
        q: str | None = None,
        source: BookingRequestSource | None = None,
        sort: str = "sla",
    ) -> tuple[list[BookingRequestOut], int, dict[str, int]]:
        laundry = await self._require_partner_laundry(partner_user_id)
        sort_by, sort_dir = self._parse_sort(sort)
        rows, total = await self._repo.list(
            status=status,
            statuses=statuses,
            priority=priority,
            assigned_laundry_id=laundry.id,
            phone=phone,
            q=q,
            source=source,
            page=page,
            page_size=page_size,
            sort_by=sort_by,
            sort_dir=sort_dir,
        )
        laundry_names = {laundry.id: laundry.name}
        items = [await self._to_out(r, laundry_names=laundry_names) for r in rows]
        inbox = await self._repo.inbox_counts(assigned_laundry_id=laundry.id)
        return items, total, inbox

    async def partner_create(
        self,
        payload: BookingRequestPartnerCreate,
        *,
        partner_user_id: UUID,
    ) -> BookingRequestOut:
        laundry = await self._require_partner_laundry(partner_user_id)
        await self._require_assignable_laundry(laundry.id)
        open_ids = await self._repo.list_open_ids_by_phone(payload.phone)
        now = datetime.now(UTC)
        row = BookingRequest(
            public_code=await self._allocate_public_code(),
            customer_name=payload.customer_name,
            phone_e164=payload.phone,
            service_type=payload.service_type,
            preferred_time_window=payload.preferred_time_window,
            notes=payload.notes,
            address_text=payload.address_text,
            city=payload.city,
            pincode=payload.pincode,
            source=BookingRequestSource.partner_created,
            status=BookingRequestStatus.assigned,
            priority=payload.priority,
            assigned_laundry_id=laundry.id,
            assigned_at=now,
            assigned_by_user_id=partner_user_id,
            created_by_role=BookingRequestCreatedByRole.partner,
            created_by_user_id=partner_user_id,
        )
        saved = await self._repo.create(row)
        await self._repo.add_event(
            BookingRequestEvent(
                booking_request_id=saved.id,
                event_type=BookingRequestEventType.created,
                actor_user_id=partner_user_id,
                to_status=saved.status,
                to_laundry_id=laundry.id,
                payload={"source": saved.source.value},
            ),
        )
        log.info(
            "booking_request.created",
            booking_request_id=str(saved.id),
            public_code=saved.public_code,
            role="partner",
            laundry_id=str(laundry.id),
        )
        return await self._to_out(
            saved,
            laundry_names={laundry.id: laundry.name},
            open_duplicate_ids=open_ids,
        )

    async def partner_get(self, partner_user_id: UUID, booking_request_id: UUID) -> BookingRequestDetailOut:
        laundry = await self._require_partner_laundry(partner_user_id)
        row = await self._require_partner_row(booking_request_id, laundry.id)
        return await self._to_detail(row, laundry_names={laundry.id: laundry.name})

    async def partner_update(
        self,
        partner_user_id: UUID,
        booking_request_id: UUID,
        payload: BookingRequestUpdate,
    ) -> BookingRequestOut:
        laundry = await self._require_partner_laundry(partner_user_id)
        row = await self._require_partner_row(booking_request_id, laundry.id)
        return await self._apply_update(
            row,
            payload,
            actor_user_id=partner_user_id,
            role="partner",
            laundry_names={laundry.id: laundry.name},
        )

    async def partner_release(self, partner_user_id: UUID, booking_request_id: UUID) -> BookingRequestOut:
        laundry = await self._require_partner_laundry(partner_user_id)
        row = await self._require_partner_row(booking_request_id, laundry.id)
        if row.status in BOOKING_REQUEST_TERMINAL_STATUSES:
            raise BookingRequestAlreadyTerminalError()
        saved = await self._repo.release(row, actor_user_id=partner_user_id)
        return await self._to_out(saved)

    async def partner_add_message(
        self,
        partner_user_id: UUID,
        booking_request_id: UUID,
        payload: BookingRequestMessageCreate,
    ) -> BookingRequestDetailOut:
        laundry = await self._require_partner_laundry(partner_user_id)
        row = await self._require_partner_row(booking_request_id, laundry.id)
        await self._add_message(
            row,
            payload,
            author_user_id=partner_user_id,
            author_role=BookingRequestMessageAuthorRole.partner,
            allow_customer_facing_on_terminal=False,
        )
        refreshed = await self._require_partner_row(booking_request_id, laundry.id)
        if payload.visibility == BookingRequestMessageVisibility.customer_facing:
            log.info("booking_request.contacted", booking_request_id=str(refreshed.id), role="partner")
        return await self._to_detail(refreshed, laundry_names={laundry.id: laundry.name})

    async def partner_by_phone(self, partner_user_id: UUID, phone: str) -> BookingRequestPhoneTimelineOut:
        laundry = await self._require_partner_laundry(partner_user_id)
        phone_e164 = validate_strict_indian_mobile(phone)
        rows = await self._repo.list_by_phone(
            phone_e164,
            include_deleted=False,
            laundry_history_id=laundry.id,
            limit=50,
        )
        return await self._phone_timeline(
            phone_e164,
            rows,
            laundry_names={laundry.id: laundry.name},
        )

    async def partner_convert(
        self,
        partner_user_id: UUID,
        booking_request_id: UUID,
        payload: BookingRequestConvert,
    ) -> BookingRequestConvertResult:
        laundry = await self._require_partner_laundry(partner_user_id)
        row = await self._require_partner_row(booking_request_id, laundry.id)
        # Partners cannot force; ignore client force flag.
        safe = payload.model_copy(update={"force": False, "laundry_id": laundry.id})
        return await self._convert(
            row,
            safe,
            actor_user_id=partner_user_id,
            order_source=OrderSource.assisted_partner,
            force=False,
            partner_laundry_id=laundry.id,
        )

    # ---------- Internals ----------
    async def _convert(
        self,
        row: BookingRequest,
        payload: BookingRequestConvert,
        *,
        actor_user_id: UUID,
        order_source: OrderSource,
        force: bool,
        partner_laundry_id: UUID | None,
    ) -> BookingRequestConvertResult:
        if row.status in BOOKING_REQUEST_TERMINAL_STATUSES or row.converted_order_id is not None:
            raise BookingRequestAlreadyTerminalError(
                "Booking request is already closed or converted",
            )
        if row.status != BookingRequestStatus.confirmed and not force:
            raise BookingRequestInvalidTransitionError(
                "Booking request must be confirmed before convert (or pass force=true)",
            )
        if force and row.status not in (
            BookingRequestStatus.confirmed,
            BookingRequestStatus.contacted,
        ):
            raise BookingRequestInvalidTransitionError(
                "force=true only allows convert from contacted or confirmed",
            )

        laundry_id = payload.laundry_id or row.assigned_laundry_id
        if laundry_id is None:
            raise ValidationError("Assign a laundry (or pass laundry_id) before convert")
        if partner_laundry_id is not None and laundry_id != partner_laundry_id:
            raise ValidationError("Partner convert must use the assigned laundry")

        address_id = payload.address_id
        address_snap = payload.address.model_dump() if payload.address is not None else None
        if address_id is None and address_snap is None:
            address_snap = self._address_snapshot_from_request(row)

        notes = payload.notes if payload.notes is not None else row.notes
        if notes:
            notes = f"{notes}\n[From booking request {row.public_code}]".strip()
        else:
            notes = f"[From booking request {row.public_code}]"

        desk = CustomerDeskService(self._session)
        order = await desk.create_assisted(
            actor_user_id=actor_user_id,
            order_source=order_source,
            phone=row.phone_e164,
            customer_name=row.customer_name,
            laundry_id=laundry_id,
            address_id=address_id,
            address=address_snap,
            pickup_at=payload.pickup_at,
            delivery_at=payload.delivery_at,
            items=[item.model_dump() for item in payload.items],
            notes=notes,
            payment_method=payload.payment_method,
            idempotency_key=f"br-convert-{row.id}",
            partner_laundry_id=partner_laundry_id,
        )

        from_status = row.status
        await self._repo.update(
            row,
            fields={
                "status": BookingRequestStatus.converted_to_order,
                "converted_order_id": order.id,
                "assigned_laundry_id": laundry_id,
            },
            actor_user_id=actor_user_id,
            record_event=False,
        )
        await self._repo.add_event(
            BookingRequestEvent(
                booking_request_id=row.id,
                event_type=BookingRequestEventType.converted,
                actor_user_id=actor_user_id,
                from_status=from_status,
                to_status=BookingRequestStatus.converted_to_order,
                to_laundry_id=laundry_id,
                payload={
                    "converted_order_id": str(order.id),
                    "tracking_code": order.tracking_code,
                    "order_source": order.order_source.value
                    if hasattr(order.order_source, "value")
                    else str(order.order_source),
                    "force": force,
                },
            ),
        )
        log.info(
            "booking_request.converted",
            booking_request_id=str(row.id),
            public_code=row.public_code,
            order_id=str(order.id),
            tracking_code=order.tracking_code,
            force=force,
        )
        return BookingRequestConvertResult(
            booking_request_id=row.id,
            public_code=row.public_code,
            status=BookingRequestStatus.converted_to_order,
            converted_order_id=order.id,
            tracking_code=order.tracking_code,
            order_source=order.order_source,
            total_inr=order.total_inr,
            currency=order.currency or "INR",
        )

    @staticmethod
    def _address_snapshot_from_request(row: BookingRequest) -> dict[str, str | None]:
        line1 = (row.address_text or "").strip()
        city = (row.city or "").strip()
        pincode = (row.pincode or "").strip()
        if not line1 or not city or not pincode:
            raise ValidationError(
                "Provide address (or address_id); booking request is missing address_text/city/pincode",
            )
        if not pincode.isdigit() or len(pincode) != 6:
            raise ValidationError("Booking request pincode must be 6 digits for convert")
        return {
            "line1": line1,
            "line2": None,
            "city": city,
            "pincode": pincode,
            "landmark": None,
        }

    async def _apply_update(
        self,
        row: BookingRequest,
        payload: BookingRequestUpdate,
        *,
        actor_user_id: UUID,
        role: str,
        laundry_names: dict[UUID, str] | None = None,
    ) -> BookingRequestOut:
        if row.status in BOOKING_REQUEST_TERMINAL_STATUSES:
            raise BookingRequestAlreadyTerminalError()

        fields = payload.model_dump(exclude_unset=True)
        if not fields:
            return await self._to_out(row, laundry_names=laundry_names)

        new_status = fields.get("status")
        if new_status is not None and new_status != row.status:
            self._assert_transition(row.status, new_status, role=role)

        saved = await self._repo.update(row, fields=fields, actor_user_id=actor_user_id)
        return await self._to_out(saved, laundry_names=laundry_names)

    async def _add_message(
        self,
        row: BookingRequest,
        payload: BookingRequestMessageCreate,
        *,
        author_user_id: UUID,
        author_role: BookingRequestMessageAuthorRole,
        allow_customer_facing_on_terminal: bool,
    ) -> BookingRequestMessage:
        if row.status in BOOKING_REQUEST_TERMINAL_STATUSES:
            if payload.visibility == BookingRequestMessageVisibility.customer_facing:
                if not allow_customer_facing_on_terminal:
                    raise BookingRequestAlreadyTerminalError(
                        "Cannot send customer-facing messages on a closed request",
                    )
            # internal notes always allowed
        return await self._repo.add_message(
            BookingRequestMessage(
                booking_request_id=row.id,
                author_user_id=author_user_id,
                author_role=author_role,
                visibility=payload.visibility,
                body=payload.body,
            ),
        )

    def _assert_transition(
        self,
        current: BookingRequestStatus,
        target: BookingRequestStatus,
        *,
        role: str,
    ) -> None:
        matrix = _ADMIN_TRANSITIONS if role == "admin" else _PARTNER_TRANSITIONS
        allowed = matrix.get(current, set())
        if target not in allowed:
            raise BookingRequestInvalidTransitionError(
                f"Cannot transition from '{current.value}' to '{target.value}'",
            )

    async def _require_row(
        self,
        booking_request_id: UUID,
        *,
        include_deleted: bool = False,
    ) -> BookingRequest:
        row = await self._repo.get_by_id(booking_request_id, include_deleted=include_deleted)
        if row is None:
            raise BookingRequestNotFoundError()
        return row

    async def _require_partner_row(
        self,
        booking_request_id: UUID,
        laundry_id: UUID,
    ) -> BookingRequest:
        row = await self._repo.get_by_id(booking_request_id)
        if row is None or row.assigned_laundry_id != laundry_id:
            raise BookingRequestNotFoundError()
        return row

    async def _require_partner_laundry(self, partner_user_id: UUID):
        laundry = await self._laundries.get_by_owner(partner_user_id)
        if laundry is None:
            raise NotFoundError("Partner laundry not found")
        return laundry

    async def _require_assignable_laundry(self, laundry_id: UUID) -> Laundry:
        laundry = await self._laundries.get_by_id(laundry_id)
        if laundry is None:
            raise ValidationError(
                "Laundry is not available for assignment",
                details=[ErrorDetail(field="laundry_id", issue="Does not exist")],
            )
        if laundry.status != LaundryStatus.approved:
            raise ValidationError(
                "Laundry must be approved and active",
                details=[ErrorDetail(field="laundry_id", issue="Not approved or inactive")],
            )
        return laundry

    @staticmethod
    def _score_laundry_suggestion(
        request: BookingRequest,
        laundry: Laundry,
    ) -> BookingRequestLaundrySuggestion:
        score = 0.0
        reasons: list[str] = []
        city = (request.city or "").strip().lower()
        pincode = (request.pincode or "").strip()
        laundry_city = (laundry.city or "").strip().lower()
        address = (laundry.address_line or "").lower()

        if pincode and pincode in address:
            score += 100.0
            reasons.append("pincode_match")
        if city and city in laundry_city:
            score += 50.0
            reasons.append("city_match")
        # Soft geo: both laundry coords present (customer coords not collected in v1)
        if laundry.latitude is not None and laundry.longitude is not None and (city or pincode):
            if "city_match" in reasons or "pincode_match" in reasons:
                score += 15.0
                reasons.append("nearest_area")

        rating = float(laundry.avg_rating or 0)
        score += rating * 10.0
        if rating >= 4.0:
            reasons.append("highest_rated")

        updated = laundry.updated_at
        if updated is not None:
            if updated.tzinfo is None:
                updated = updated.replace(tzinfo=UTC)
            age_hours = max(0.0, (datetime.now(UTC) - updated).total_seconds() / 3600.0)
            recency = max(0.0, 10.0 - min(age_hours / 24.0, 10.0))
            score += recency
            if not reasons:
                reasons.append("recently_active")
            elif "city_match" not in reasons and "pincode_match" not in reasons:
                reasons.append("recently_active")

        if not reasons:
            reasons.append("highest_rated" if rating > 0 else "recently_active")

        return BookingRequestLaundrySuggestion(
            laundry_id=laundry.id,
            name=laundry.name,
            city=laundry.city,
            avg_rating=round(rating, 2),
            reason=reasons[0],
            score=round(score, 2),
        )

    async def _enforce_public_rate_limits(self, phone: str, client_ip: str | None) -> None:
        since = datetime.now(UTC) - PUBLIC_WINDOW
        phone_count = await self._repo.count_recent_by_phone(phone, since)
        if phone_count >= PUBLIC_PHONE_LIMIT:
            raise RateLimitError(
                "Too many booking requests for this phone number. Please try again later.",
            )
        if client_ip:
            ip_count = await self._repo.count_recent_by_ip(client_ip, since)
            if ip_count >= PUBLIC_IP_LIMIT:
                raise RateLimitError(
                    "Too many booking requests from this network. Please try again later.",
                )

    async def _allocate_public_code(self) -> str:
        for _ in range(12):
            code = f"BR-{secrets.token_hex(3).upper()}"
            if await self._repo.get_by_public_code(code, include_deleted=True) is None:
                return code
        raise ValidationError("Could not allocate booking request code")

    async def _laundry_names(self, laundry_ids: set[UUID | None]) -> dict[UUID, str]:
        names: dict[UUID, str] = {}
        for laundry_id in laundry_ids:
            if laundry_id is None:
                continue
            laundry = await self._laundries.get_by_id(laundry_id)
            if laundry is not None:
                names[laundry_id] = laundry.name
        return names

    async def _phone_timeline(
        self,
        phone_e164: str,
        rows: list[BookingRequest],
        *,
        laundry_names: dict[UUID, str] | None = None,
    ) -> BookingRequestPhoneTimelineOut:
        names = laundry_names or await self._laundry_names({r.assigned_laundry_id for r in rows})
        requests = [await self._to_out(r, laundry_names=names) for r in rows]
        messages_preview: list[BookingRequestMessageOut] = []
        for row in rows[:10]:
            msgs = await self._repo.list_messages(row.id, limit=5)
            messages_preview.extend(BookingRequestMessageOut.model_validate(m) for m in msgs)
        messages_preview.sort(key=lambda m: m.created_at, reverse=True)
        return BookingRequestPhoneTimelineOut(
            phone_e164=phone_e164,
            requests=requests,
            messages_preview=messages_preview[:20],
        )

    async def _to_detail(
        self,
        row: BookingRequest,
        *,
        laundry_names: dict[UUID, str] | None = None,
    ) -> BookingRequestDetailOut:
        base = await self._to_out(row, laundry_names=laundry_names)
        messages = await self._repo.list_messages(row.id, limit=50)
        events = await self._repo.list_events(row.id, limit=50)
        return BookingRequestDetailOut(
            **base.model_dump(),
            messages=[BookingRequestMessageOut.model_validate(m) for m in messages],
            events=[BookingRequestEventOut.model_validate(e) for e in events],
        )

    async def _to_out(
        self,
        row: BookingRequest,
        *,
        laundry_names: dict[UUID, str] | None = None,
        open_duplicate_ids: list[UUID] | None = None,
    ) -> BookingRequestOut:
        now = datetime.now(UTC)
        created = row.created_at if row.created_at.tzinfo else row.created_at.replace(tzinfo=UTC)
        age = max(0, int((now - created).total_seconds()))
        badge = self._sla_badge(row, age_seconds=age)
        name = None
        if row.assigned_laundry_id is not None:
            if laundry_names and row.assigned_laundry_id in laundry_names:
                name = laundry_names[row.assigned_laundry_id]
            else:
                laundry = await self._laundries.get_by_id(row.assigned_laundry_id)
                name = laundry.name if laundry else None

        duplicates = open_duplicate_ids
        if duplicates is None:
            open_ids = await self._repo.list_open_ids_by_phone(row.phone_e164)
            duplicates = [i for i in open_ids if i != row.id]

        return BookingRequestOut(
            id=row.id,
            public_code=row.public_code,
            customer_name=row.customer_name,
            phone_e164=row.phone_e164,
            service_type=row.service_type,
            preferred_time_window=row.preferred_time_window,
            address_text=row.address_text,
            city=row.city,
            pincode=row.pincode,
            notes=row.notes,
            source=row.source,
            status=row.status,
            priority=row.priority,
            sla_badge=badge,
            sla_age_seconds=age,
            assigned_laundry_id=row.assigned_laundry_id,
            assigned_laundry_name=name,
            assigned_at=row.assigned_at,
            assigned_by_user_id=row.assigned_by_user_id,
            converted_order_id=row.converted_order_id,
            created_by_role=row.created_by_role,
            created_by_user_id=row.created_by_user_id,
            last_response_at=row.last_response_at,
            closed_at=row.closed_at,
            deleted_at=row.deleted_at,
            created_at=row.created_at,
            updated_at=row.updated_at,
            whatsapp_url=self._whatsapp_url(row),
            open_duplicate_ids=duplicates,
        )

    @staticmethod
    def _sla_badge(row: BookingRequest, *, age_seconds: int) -> str:
        if row.status in BOOKING_REQUEST_TERMINAL_STATUSES:
            return "na"
        if row.status in (BookingRequestStatus.contacted, BookingRequestStatus.confirmed):
            return "met"
        if age_seconds < 15 * 60:
            return "fresh"
        if age_seconds < 60 * 60:
            return "aging"
        return "overdue"

    @staticmethod
    def _whatsapp_url(row: BookingRequest) -> str:
        digits = phone_digits(row.phone_e164)
        service = _SERVICE_LABELS.get(row.service_type, row.service_type.value)
        preferred = _TIME_LABELS.get(row.preferred_time_window, row.preferred_time_window.value)
        text = (
            f"Hi {row.customer_name}! This is WashHouse regarding booking {row.public_code}.\n"
            f"Service: {service}. Preferred: {preferred}.\n"
            "Please reply with your pickup address / landmark so we can confirm. Thank you!"
        )
        return f"https://wa.me/{digits}?text={quote(text)}"

    @staticmethod
    def _parse_sort(sort: str) -> tuple[str, str]:
        raw = (sort or "sla").strip()
        if raw.startswith("-"):
            return raw[1:] or "sla", "desc"
        if raw in {"sla", "created_at", "updated_at", "last_response_at", "priority", "status"}:
            return raw, "desc" if raw != "sla" else "asc"
        return "sla", "asc"
