"""Customer experience — contact, Q&A, engagement analytics."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import AuthorizationError, NotFoundError, ValidationError
from app.models.customer_experience import CallbackRequest, CustomerQuestion
from app.models.enums import CallbackRequestStatus, EngagementEventType, LaundryStatus, QuestionStatus
from app.repositories.customer_experience import CustomerExperienceRepository
from app.repositories.laundry import LaundryRepository
from app.repositories.storefront import StorefrontRepository
from app.services.storefront_service import StorefrontService, resolve_guest_contact_fields


def _whatsapp_url(number: str, message: str | None = None) -> str:
    digits = "".join(c for c in number if c.isdigit())
    base = f"https://wa.me/{digits}"
    if message:
        from urllib.parse import quote

        return f"{base}?text={quote(message)}"
    return base


def _google_maps_url(
    latitude: float | None,
    longitude: float | None,
    *,
    address: str | None = None,
) -> str | None:
    if latitude is not None and longitude is not None:
        return f"https://www.google.com/maps/search/?api=1&query={latitude},{longitude}"
    if address:
        from urllib.parse import quote

        return f"https://www.google.com/maps/search/?api=1&query={quote(address)}"
    return None


def _location_fields(laundry) -> dict:
    full_address = f"{laundry.address_line}, {laundry.city}"
    latitude = float(laundry.latitude) if laundry.latitude is not None else None
    longitude = float(laundry.longitude) if laundry.longitude is not None else None
    return {
        "address_line": laundry.address_line,
        "city": laundry.city,
        "latitude": latitude,
        "longitude": longitude,
        "full_address": full_address,
        "map_url": _google_maps_url(latitude, longitude, address=full_address),
    }


def _serialize_service(row) -> dict:
    return {
        "id": row.id,
        "name": row.name,
        "category": row.category,
        "unit": row.unit,
        "price_inr": row.price_inr,
        "description": row.description,
        "estimated_duration_minutes": row.estimated_duration_minutes,
        "express_available": row.express_available,
        "pickup_available": row.pickup_available,
        "delivery_available": row.delivery_available,
        "catalog_status": row.catalog_status,
        "view_count": row.view_count,
        "order_count": row.order_count,
        "sort_order": row.sort_order,
        "is_active": row.is_active,
    }


def _serialize_question(row: CustomerQuestion) -> dict:
    return {
        "id": row.id,
        "laundry_id": row.laundry_id,
        "customer_id": row.customer_id,
        "question": row.question,
        "answer": row.answer,
        "status": row.status.value,
        "answered_at": row.answered_at.isoformat() if row.answered_at else None,
        "created_at": row.created_at.isoformat(),
    }


class CustomerExperienceService:
    CONTACT_REQUIRES_LOGIN = True

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = CustomerExperienceRepository(session)
        self._laundries = LaundryRepository(session)
        self._storefronts = StorefrontRepository(session)

    async def list_categories(self) -> list[dict]:
        rows = await self._repo.list_categories()
        return [
            {
                "id": r.id,
                "slug": r.slug,
                "name": r.name,
                "description": r.description,
                "icon": r.icon,
                "sort_order": r.sort_order,
                "is_active": r.is_active,
            }
            for r in rows
        ]

    async def list_facility_tags(self) -> list[dict]:
        rows = await self._repo.list_facility_tags()
        return [{"id": r.id, "slug": r.slug, "name": r.name, "sort_order": r.sort_order, "is_active": r.is_active} for r in rows]

    async def browse_services(
        self,
        laundry_id: UUID,
        *,
        q: str | None = None,
        category: str | None = None,
        express_only: bool = False,
        sort: str = "popular",
    ) -> list[dict]:
        rows = await self._repo.list_services_for_laundry(
            laundry_id,
            q=q,
            category=category,
            express_only=express_only,
            sort=sort,
        )
        return [_serialize_service(r) for r in rows]

    async def get_service_detail(self, laundry_id: UUID, service_id: UUID) -> dict:
        row = await self._repo.get_service(service_id, laundry_id)
        if not row or not row.is_active or row.catalog_status != "active":
            raise NotFoundError("Service not found")
        await self._repo.increment_service_view(service_id)
        await self._repo.record_event(
            laundry_id=laundry_id,
            event_type=EngagementEventType.service_view,
            service_id=service_id,
            source="service_detail",
        )
        return _serialize_service(row)

    async def record_store_view(self, laundry_id: UUID, *, customer_id: UUID | None = None) -> None:
        await self._repo.record_event(
            laundry_id=laundry_id,
            event_type=EngagementEventType.store_view,
            customer_id=customer_id,
            source="storefront",
        )

    async def get_contact_info(
        self,
        laundry_id: UUID,
        *,
        customer_id: UUID | None = None,
        customer_role: str | None = None,
    ) -> dict:
        laundry = await self._laundries.get_by_id(laundry_id)
        if not laundry:
            raise NotFoundError("Laundry not found")
        sf = await self._storefronts.get_by_laundry(laundry_id)
        location = _location_fields(laundry)
        working_hours = sf.working_hours if sf else None
        offline_mode = not settings.FEATURE_ONLINE_BOOKING
        wa_message = f"Hi {laundry.name}, I have a question about your laundry services."
        laundry_approved = laundry.status == LaundryStatus.approved

        if offline_mode:
            if laundry_approved and not sf:
                sf = await StorefrontService(self._session).get_or_create_for_laundry(laundry)
                working_hours = sf.working_hours
            contact = resolve_guest_contact_fields(sf, laundry_approved=laundry_approved)
            show_call = bool(contact["show_call"])
            show_whatsapp = bool(contact["show_whatsapp"])
            contact_available = show_call or show_whatsapp
            phone = contact["phone"]
            whatsapp = contact["whatsapp_number"]
            return {
                "offline_booking_mode": True,
                "contact_available": contact_available,
                "can_contact": contact_available or bool(location["map_url"]),
                "requires_login": False,
                "show_call": show_call,
                "show_whatsapp": show_whatsapp,
                "show_callback": False,
                "phone": phone,
                "whatsapp_number": whatsapp,
                "whatsapp_url": _whatsapp_url(whatsapp, wa_message) if show_whatsapp and whatsapp else None,
                "working_hours": working_hours,
                **location,
            }

        is_registered = customer_role == "customer"
        requires_login = self.CONTACT_REQUIRES_LOGIN and not is_registered
        contact = resolve_guest_contact_fields(sf, laundry_approved=laundry_approved)
        phone = contact["phone"]
        whatsapp = contact["whatsapp_number"]
        show_call = bool(contact["show_call"])
        show_whatsapp = bool(contact["show_whatsapp"])
        contact_available = show_call or show_whatsapp
        show_callback = bool(sf and sf.show_callback)
        return {
            "offline_booking_mode": False,
            "contact_available": contact_available,
            "can_contact": is_registered and (show_call or show_whatsapp or show_callback),
            "requires_login": requires_login,
            "show_call": show_call,
            "show_whatsapp": show_whatsapp,
            "show_callback": show_callback and is_registered,
            "phone": phone if is_registered and show_call else None,
            "whatsapp_number": whatsapp if is_registered and show_whatsapp else None,
            "whatsapp_url": _whatsapp_url(whatsapp, wa_message) if is_registered and show_whatsapp and whatsapp else None,
            "working_hours": working_hours,
            **location,
        }

    async def track_contact(
        self,
        laundry_id: UUID,
        *,
        event_type: str,
        customer_id: UUID | None,
        customer_role: str | None,
        service_id: UUID | None = None,
        source: str | None = None,
    ) -> dict:
        offline_mode = not settings.FEATURE_ONLINE_BOOKING
        if event_type in ("call_click", "whatsapp_click", "callback_request"):
            if offline_mode:
                if event_type == "callback_request" and customer_role != "customer":
                    raise AuthorizationError("Sign in to contact this laundry")
            elif self.CONTACT_REQUIRES_LOGIN and customer_role != "customer" and not customer_id:
                raise AuthorizationError("Sign in to contact this laundry")
        try:
            et = EngagementEventType(event_type)
        except ValueError as exc:
            raise ValidationError("Invalid event type") from exc
        should_track = True
        if offline_mode and event_type in ("call_click", "whatsapp_click") and not customer_id:
            should_track = False
        if should_track:
            await self._repo.record_event(
                laundry_id=laundry_id,
                event_type=et,
                customer_id=customer_id,
                service_id=service_id,
                source=source,
            )
        contact = await self.get_contact_info(laundry_id, customer_id=customer_id, customer_role=customer_role)
        return contact

    async def request_callback(
        self,
        laundry_id: UUID,
        customer_id: UUID,
        *,
        phone: str,
        preferred_time: str | None,
    ) -> dict:
        row = CallbackRequest(
            laundry_id=laundry_id,
            customer_id=customer_id,
            phone=phone.strip(),
            preferred_time=preferred_time,
            status=CallbackRequestStatus.pending,
        )
        await self._repo.create_callback(row)
        await self._repo.record_event(
            laundry_id=laundry_id,
            event_type=EngagementEventType.callback_request,
            customer_id=customer_id,
            source="callback_form",
            metadata={"phone": phone},
        )
        return {"id": row.id, "status": row.status.value}

    async def list_public_questions(self, laundry_id: UUID) -> list[dict]:
        rows = await self._repo.list_questions_for_laundry(laundry_id)
        return [_serialize_question(r) for r in rows if r.status == QuestionStatus.answered]

    async def ask_question(self, laundry_id: UUID, customer_id: UUID, question: str) -> dict:
        row = CustomerQuestion(
            laundry_id=laundry_id,
            customer_id=customer_id,
            question=question.strip(),
            status=QuestionStatus.pending,
        )
        await self._repo.create_question(row)
        await self._repo.record_event(
            laundry_id=laundry_id,
            event_type=EngagementEventType.question_asked,
            customer_id=customer_id,
            source="question_form",
        )
        return _serialize_question(row)

    async def partner_list_questions(self, partner_user_id: UUID) -> list[dict]:
        laundry = await self._laundries.get_by_owner(partner_user_id)
        if not laundry:
            raise NotFoundError("Laundry not found")
        rows = await self._repo.list_questions_for_laundry(laundry.id, include_hidden=True)
        return [_serialize_question(r) for r in rows]

    async def partner_answer_question(self, partner_user_id: UUID, question_id: UUID, answer: str) -> dict:
        laundry = await self._laundries.get_by_owner(partner_user_id)
        if not laundry:
            raise NotFoundError("Laundry not found")
        row = await self._repo.get_question(question_id)
        if not row or row.laundry_id != laundry.id:
            raise NotFoundError("Question not found")
        row.answer = answer.strip()
        row.status = QuestionStatus.answered
        row.answered_at = datetime.now(UTC)
        row.answered_by = partner_user_id
        await self._session.flush()
        return _serialize_question(row)

    async def partner_engagement_analytics(self, partner_user_id: UUID, *, days: int = 30) -> dict:
        laundry = await self._laundries.get_by_owner(partner_user_id)
        if not laundry:
            raise NotFoundError("Laundry not found")
        return await self._repo.engagement_summary(laundry.id, days=days)
