"""Best-effort booking-request notifications (in-app + email/WhatsApp stubs).

Never raises after the booking request is persisted — mirrors marketing contact
support email and order WhatsApp stub patterns.
"""

from __future__ import annotations

from uuid import UUID

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.booking_request import BookingRequest
from app.models.enums import UserRole
from app.models.laundry import Laundry
from app.models.notification import Notification
from app.models.user import User
from app.services.notifications.dispatch import is_channel_enabled
from app.services.notifications.email import send_notification_email
from app.services.notifications.whatsapp import get_whatsapp_provider

log = structlog.get_logger(__name__)

_ADMIN_NOTIFY_LIMIT = 50


class BookingRequestNotifier:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def notify_admins_new_request(self, row: BookingRequest) -> None:
        """In-app + support email (+ WhatsApp stub) when a public lead lands."""
        try:
            title = f"New booking request {row.public_code}"
            body = (
                f"{row.customer_name} · {row.phone_e164}\n"
                f"Service: {row.service_type.value} · "
                f"{row.preferred_time_window.value}\n"
                f"City: {row.city or '—'} · Pincode: {row.pincode or '—'}"
            )
            await self._in_app_admins(title=title, body=body)
            await self._support_email(
                event="booking_request.admin_email",
                subject=f"[WashHouse Booking] {row.public_code}: {row.customer_name}",
                text=(
                    f"New booking request\n"
                    f"-------------------\n"
                    f"Code: {row.public_code}\n"
                    f"ID: {row.id}\n"
                    f"Name: {row.customer_name}\n"
                    f"Phone: {row.phone_e164}\n"
                    f"Service: {row.service_type.value}\n"
                    f"Preferred: {row.preferred_time_window.value}\n"
                    f"City: {row.city or '—'}\n"
                    f"Pincode: {row.pincode or '—'}\n"
                    f"Notes: {row.notes or '—'}\n"
                ),
                entity_id=str(row.id),
            )
            await self._whatsapp_stub(
                phone=row.phone_e164,
                template="booking_request_created_ops",
                variables={
                    "public_code": row.public_code,
                    "customer_name": row.customer_name,
                },
            )
        except Exception:
            log.exception(
                "booking_request.notify_admins_failed",
                booking_request_id=str(row.id),
            )

    async def notify_partner_assigned(self, row: BookingRequest, laundry: Laundry) -> None:
        """In-app + WhatsApp stub to laundry owner when admin assigns/transfers."""
        try:
            title = f"Booking request assigned · {row.public_code}"
            body = (
                f"{row.customer_name} · {row.phone_e164}\n"
                f"Service: {row.service_type.value} · "
                f"{row.preferred_time_window.value}\n"
                f"Open partner inbox to respond."
            )
            if await is_channel_enabled(self._session, "in_app"):
                self._session.add(
                    Notification(
                        user_id=laundry.owner_user_id,
                        title=title,
                        body=body[:500],
                    ),
                )
                await self._session.flush()
                log.info(
                    "booking_request.partner_in_app.ok",
                    booking_request_id=str(row.id),
                    laundry_id=str(laundry.id),
                )

            owner = await self._session.scalar(
                select(User).where(User.id == laundry.owner_user_id, User.deleted_at.is_(None)),
            )
            phone = owner.phone if owner else None
            await self._whatsapp_stub(
                phone=phone,
                template="booking_request_assigned",
                variables={
                    "public_code": row.public_code,
                    "customer_name": row.customer_name,
                    "laundry_name": laundry.name,
                },
            )
            if owner and owner.email and await is_channel_enabled(self._session, "email"):
                await send_notification_email(
                    to=owner.email,
                    subject=title,
                    body=body,
                )
        except Exception:
            log.exception(
                "booking_request.notify_partner_failed",
                booking_request_id=str(row.id),
                laundry_id=str(laundry.id),
            )

    async def _in_app_admins(self, *, title: str, body: str) -> None:
        if not await is_channel_enabled(self._session, "in_app"):
            return
        admin_ids = await self._list_admin_ids()
        for uid in admin_ids:
            self._session.add(
                Notification(
                    user_id=uid,
                    title=title,
                    body=body[:500],
                ),
            )
        if admin_ids:
            await self._session.flush()
            log.info("booking_request.admin_in_app.ok", recipients=len(admin_ids))

    async def _list_admin_ids(self) -> list[UUID]:
        result = await self._session.execute(
            select(User.id)
            .where(
                User.deleted_at.is_(None),
                User.role.in_((UserRole.admin, UserRole.super_admin)),
            )
            .limit(_ADMIN_NOTIFY_LIMIT),
        )
        return list(result.scalars().all())

    async def _support_email(
        self,
        *,
        event: str,
        subject: str,
        text: str,
        entity_id: str,
    ) -> None:
        if not await is_channel_enabled(self._session, "email"):
            log.info(f"{event}.skipped_channel_disabled", entity_id=entity_id)
            return
        inbox = settings.support_inbox
        if not inbox:
            log.warning(f"{event}.skipped_no_inbox", entity_id=entity_id)
            return
        sent = await send_notification_email(to=inbox, subject=subject, body=text)
        if sent:
            log.info(f"{event}.ok", entity_id=entity_id)
        else:
            log.warning(f"{event}.skipped_or_failed", entity_id=entity_id)

    async def _whatsapp_stub(
        self,
        *,
        phone: str | None,
        template: str,
        variables: dict[str, str],
    ) -> None:
        if not phone:
            log.info("booking_request.whatsapp.skipped_no_phone", template=template)
            return
        try:
            await get_whatsapp_provider().send_template(phone, template, variables)
        except Exception:
            log.exception("booking_request.whatsapp.failed", template=template)
