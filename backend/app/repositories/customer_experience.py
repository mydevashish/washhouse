"""Customer experience persistence."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer_experience import (
    CallbackRequest,
    CustomerQuestion,
    PlatformFacilityTag,
    ServiceCategory,
    StorefrontEngagementEvent,
)
from app.models.enums import CallbackRequestStatus, EngagementEventType, QuestionStatus
from app.models.laundry import LaundryService
from app.models.storefront import LaundryStorefront


class CustomerExperienceRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_categories(self, *, active_only: bool = True) -> list[ServiceCategory]:
        q = select(ServiceCategory).order_by(ServiceCategory.sort_order, ServiceCategory.name)
        if active_only:
            q = q.where(ServiceCategory.is_active.is_(True))
        return list((await self._session.scalars(q)).all())

    async def list_facility_tags(self, *, active_only: bool = True) -> list[PlatformFacilityTag]:
        q = select(PlatformFacilityTag).order_by(PlatformFacilityTag.sort_order, PlatformFacilityTag.name)
        if active_only:
            q = q.where(PlatformFacilityTag.is_active.is_(True))
        return list((await self._session.scalars(q)).all())

    async def get_category(self, category_id: UUID) -> ServiceCategory | None:
        return await self._session.get(ServiceCategory, category_id)

    async def get_facility_tag(self, tag_id: UUID) -> PlatformFacilityTag | None:
        return await self._session.get(PlatformFacilityTag, tag_id)

    async def list_services_for_laundry(
        self,
        laundry_id: UUID,
        *,
        q: str | None = None,
        category: str | None = None,
        express_only: bool = False,
        sort: str = "popular",
        include_inactive: bool = False,
    ) -> list[LaundryService]:
        stmt = select(LaundryService).where(
            LaundryService.laundry_id == laundry_id,
            LaundryService.deleted_at.is_(None),
        )
        if not include_inactive:
            stmt = stmt.where(LaundryService.is_active.is_(True), LaundryService.catalog_status == "active")
        if q:
            like = f"%{q.strip()}%"
            stmt = stmt.where(or_(LaundryService.name.ilike(like), LaundryService.description.ilike(like)))
        if category:
            stmt = stmt.where(LaundryService.category == category)
        if express_only:
            stmt = stmt.where(LaundryService.express_available.is_(True))
        if sort == "price_asc":
            stmt = stmt.order_by(LaundryService.price_inr.asc(), LaundryService.sort_order)
        elif sort == "price_desc":
            stmt = stmt.order_by(LaundryService.price_inr.desc(), LaundryService.sort_order)
        else:
            stmt = stmt.order_by(desc(LaundryService.order_count), desc(LaundryService.view_count), LaundryService.sort_order)
        return list((await self._session.scalars(stmt)).all())

    async def get_service(self, service_id: UUID, laundry_id: UUID | None = None) -> LaundryService | None:
        stmt = select(LaundryService).where(LaundryService.id == service_id, LaundryService.deleted_at.is_(None))
        if laundry_id:
            stmt = stmt.where(LaundryService.laundry_id == laundry_id)
        return await self._session.scalar(stmt)

    async def increment_service_view(self, service_id: UUID) -> None:
        row = await self._session.get(LaundryService, service_id)
        if row:
            row.view_count += 1
            await self._session.flush()

    async def record_event(
        self,
        *,
        laundry_id: UUID,
        event_type: EngagementEventType,
        customer_id: UUID | None = None,
        service_id: UUID | None = None,
        source: str | None = None,
        metadata: dict | None = None,
    ) -> StorefrontEngagementEvent:
        row = StorefrontEngagementEvent(
            laundry_id=laundry_id,
            customer_id=customer_id,
            service_id=service_id,
            event_type=event_type,
            source=source,
            metadata_json=metadata,
        )
        self._session.add(row)
        await self._session.flush()
        return row

    async def engagement_summary(self, laundry_id: UUID, *, days: int = 30) -> dict:
        since = datetime.now(UTC) - timedelta(days=days)
        rows = await self._session.execute(
            select(StorefrontEngagementEvent.event_type, func.count())
            .where(
                StorefrontEngagementEvent.laundry_id == laundry_id,
                StorefrontEngagementEvent.created_at >= since,
            )
            .group_by(StorefrontEngagementEvent.event_type),
        )
        counts = {event.value: count for event, count in rows.all()}
        questions = await self._session.scalar(
            select(func.count())
            .select_from(CustomerQuestion)
            .where(CustomerQuestion.laundry_id == laundry_id, CustomerQuestion.created_at >= since),
        )
        orders = counts.get("store_view", 0)
        conversions = counts.get("call_click", 0) + counts.get("whatsapp_click", 0) + counts.get("callback_request", 0)
        conversion_rate = round((conversions / orders * 100), 1) if orders else 0.0
        return {
            "store_views": counts.get("store_view", 0),
            "service_views": counts.get("service_view", 0),
            "calls_generated": counts.get("call_click", 0),
            "whatsapp_clicks": counts.get("whatsapp_click", 0),
            "questions_asked": int(questions or 0),
            "callback_requests": counts.get("callback_request", 0),
            "conversion_rate_pct": conversion_rate,
        }

    async def list_questions_for_laundry(self, laundry_id: UUID, *, include_hidden: bool = False) -> list[CustomerQuestion]:
        q = select(CustomerQuestion).where(CustomerQuestion.laundry_id == laundry_id)
        if not include_hidden:
            q = q.where(CustomerQuestion.status.in_([QuestionStatus.pending, QuestionStatus.answered]))
        q = q.order_by(desc(CustomerQuestion.created_at))
        return list((await self._session.scalars(q)).all())

    async def list_questions_admin(self, *, status: str | None = None, limit: int = 50) -> list[CustomerQuestion]:
        q = select(CustomerQuestion).order_by(desc(CustomerQuestion.created_at)).limit(limit)
        if status:
            q = q.where(CustomerQuestion.status == QuestionStatus(status))
        return list((await self._session.scalars(q)).all())

    async def get_question(self, question_id: UUID) -> CustomerQuestion | None:
        return await self._session.get(CustomerQuestion, question_id)

    async def create_question(self, row: CustomerQuestion) -> CustomerQuestion:
        self._session.add(row)
        await self._session.flush()
        return row

    async def create_callback(self, row: CallbackRequest) -> CallbackRequest:
        self._session.add(row)
        await self._session.flush()
        return row

    async def admin_engagement_overview(self, *, days: int = 30) -> dict:
        since = datetime.now(UTC) - timedelta(days=days)
        rows = await self._session.execute(
            select(StorefrontEngagementEvent.event_type, func.count())
            .where(StorefrontEngagementEvent.created_at >= since)
            .group_by(StorefrontEngagementEvent.event_type),
        )
        counts = {event.value: count for event, count in rows.all()}
        pending_questions = await self._session.scalar(
            select(func.count()).select_from(CustomerQuestion).where(CustomerQuestion.status == QuestionStatus.pending),
        )
        pending_storefronts = await self._session.scalar(
            select(func.count()).select_from(LaundryStorefront).where(LaundryStorefront.approval_status == "pending"),
        )
        return {
            "store_views": counts.get("store_view", 0),
            "service_views": counts.get("service_view", 0),
            "calls_generated": counts.get("call_click", 0),
            "whatsapp_clicks": counts.get("whatsapp_click", 0),
            "questions_asked": counts.get("question_asked", 0),
            "callback_requests": counts.get("callback_request", 0),
            "pending_questions": int(pending_questions or 0),
            "pending_storefronts": int(pending_storefronts or 0),
        }
