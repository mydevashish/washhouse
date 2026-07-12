"""Admin customer experience controls."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.models.customer_experience import PlatformFacilityTag, ServiceCategory
from app.models.enums import QuestionStatus
from app.repositories.customer_experience import CustomerExperienceRepository
from app.repositories.storefront import StorefrontRepository


class AdminCustomerExperienceService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = CustomerExperienceRepository(session)
        self._storefronts = StorefrontRepository(session)

    async def list_categories(self) -> list[dict]:
        rows = await self._repo.list_categories(active_only=False)
        return [
            {"id": r.id, "slug": r.slug, "name": r.name, "description": r.description, "icon": r.icon, "sort_order": r.sort_order, "is_active": r.is_active}
            for r in rows
        ]

    async def create_category(self, body: dict) -> dict:
        row = ServiceCategory(
            slug=body["slug"].strip().lower().replace(" ", "-"),
            name=body["name"].strip(),
            description=body.get("description"),
            icon=body.get("icon"),
            sort_order=body.get("sort_order", 0),
        )
        self._session.add(row)
        await self._session.flush()
        return {"id": row.id, "slug": row.slug, "name": row.name, "description": row.description, "icon": row.icon, "sort_order": row.sort_order, "is_active": row.is_active}

    async def update_category(self, category_id: UUID, body: dict) -> dict:
        row = await self._repo.get_category(category_id)
        if not row:
            raise NotFoundError("Category not found")
        for key in ("name", "description", "icon", "sort_order", "is_active"):
            if key in body and body[key] is not None:
                setattr(row, key, body[key])
        await self._session.flush()
        return {"id": row.id, "slug": row.slug, "name": row.name, "description": row.description, "icon": row.icon, "sort_order": row.sort_order, "is_active": row.is_active}

    async def list_facility_tags(self) -> list[dict]:
        rows = await self._repo.list_facility_tags(active_only=False)
        return [{"id": r.id, "slug": r.slug, "name": r.name, "sort_order": r.sort_order, "is_active": r.is_active} for r in rows]

    async def create_facility_tag(self, body: dict) -> dict:
        row = PlatformFacilityTag(
            slug=body["slug"].strip().lower().replace(" ", "-"),
            name=body["name"].strip(),
            sort_order=body.get("sort_order", 0),
        )
        self._session.add(row)
        await self._session.flush()
        return {"id": row.id, "slug": row.slug, "name": row.name, "sort_order": row.sort_order, "is_active": row.is_active}

    async def update_facility_tag(self, tag_id: UUID, body: dict) -> dict:
        row = await self._repo.get_facility_tag(tag_id)
        if not row:
            raise NotFoundError("Facility tag not found")
        for key in ("name", "sort_order", "is_active"):
            if key in body and body[key] is not None:
                setattr(row, key, body[key])
        await self._session.flush()
        return {"id": row.id, "slug": row.slug, "name": row.name, "sort_order": row.sort_order, "is_active": row.is_active}

    async def list_pending_storefronts(self) -> list[dict]:
        rows = await self._storefronts.list_by_approval_status("pending")
        return [{"laundry_id": r.laundry_id, "approval_status": r.approval_status, "completeness_score": r.completeness_score} for r in rows]

    async def approve_storefront(self, laundry_id: UUID) -> dict:
        row = await self._storefronts.get_by_laundry(laundry_id)
        if not row:
            raise NotFoundError("Storefront not found")
        row.approval_status = "approved"
        await self._session.flush()
        return {"laundry_id": laundry_id, "approval_status": row.approval_status}

    async def reject_storefront(self, laundry_id: UUID) -> dict:
        row = await self._storefronts.get_by_laundry(laundry_id)
        if not row:
            raise NotFoundError("Storefront not found")
        row.approval_status = "rejected"
        row.is_published = False
        await self._session.flush()
        return {"laundry_id": laundry_id, "approval_status": row.approval_status}

    async def list_questions(self, *, status: str | None = None) -> list[dict]:
        rows = await self._repo.list_questions_admin(status=status)
        return [
            {
                "id": r.id,
                "laundry_id": r.laundry_id,
                "customer_id": r.customer_id,
                "question": r.question,
                "answer": r.answer,
                "status": r.status.value,
                "answered_at": r.answered_at.isoformat() if r.answered_at else None,
                "created_at": r.created_at.isoformat(),
            }
            for r in rows
        ]

    async def moderate_question(self, question_id: UUID, *, action: str, actor_id: UUID) -> dict:
        row = await self._repo.get_question(question_id)
        if not row:
            raise NotFoundError("Question not found")
        if action == "hide":
            row.status = QuestionStatus.hidden
        elif action == "remove":
            row.status = QuestionStatus.removed
        elif action == "restore":
            row.status = QuestionStatus.answered if row.answer else QuestionStatus.pending
        else:
            raise ConflictError("Unknown moderation action")
        row.moderated_by = actor_id
        await self._session.flush()
        return {"id": row.id, "status": row.status.value}

    async def engagement_overview(self, *, days: int = 30) -> dict:
        return await self._repo.admin_engagement_overview(days=days)
