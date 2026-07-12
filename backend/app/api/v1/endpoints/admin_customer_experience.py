"""Admin customer experience API."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_admin
from app.schemas.customer_experience import AdminEngagementOverview, FacilityTagRow, QuestionRow, ServiceCategoryRow
from app.services.admin_customer_experience_service import AdminCustomerExperienceService
from pydantic import BaseModel, Field

router = APIRouter(prefix="/admin/customer-experience", tags=["admin-customer-experience"])


class CategoryCreate(BaseModel):
    slug: str = Field(max_length=80)
    name: str = Field(max_length=120)
    description: str | None = None
    icon: str | None = None
    sort_order: int = 0


class CategoryUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    icon: str | None = None
    sort_order: int | None = None
    is_active: bool | None = None


class FacilityTagCreate(BaseModel):
    slug: str = Field(max_length=80)
    name: str = Field(max_length=120)
    sort_order: int = 0


class FacilityTagUpdate(BaseModel):
    name: str | None = None
    sort_order: int | None = None
    is_active: bool | None = None


class ModerateQuestionRequest(BaseModel):
    action: str = Field(pattern="^(hide|remove|restore)$")


@router.get("/overview")
async def admin_engagement_overview(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
    days: int = Query(default=30, ge=1, le=365),
) -> dict:
    data = await AdminCustomerExperienceService(session).engagement_overview(days=days)
    return success_envelope(AdminEngagementOverview.model_validate(data), request)


@router.get("/categories")
async def admin_list_categories(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await AdminCustomerExperienceService(session).list_categories()
    return success_envelope([ServiceCategoryRow.model_validate(r) for r in data], request)


@router.post("/categories")
async def admin_create_category(
    body: CategoryCreate,
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await AdminCustomerExperienceService(session).create_category(body.model_dump())
    return success_envelope(ServiceCategoryRow.model_validate(data), request)


@router.patch("/categories/{category_id}")
async def admin_update_category(
    category_id: UUID,
    body: CategoryUpdate,
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await AdminCustomerExperienceService(session).update_category(category_id, body.model_dump(exclude_unset=True))
    return success_envelope(ServiceCategoryRow.model_validate(data), request)


@router.get("/facility-tags")
async def admin_list_facility_tags(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await AdminCustomerExperienceService(session).list_facility_tags()
    return success_envelope([FacilityTagRow.model_validate(r) for r in data], request)


@router.post("/facility-tags")
async def admin_create_facility_tag(
    body: FacilityTagCreate,
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await AdminCustomerExperienceService(session).create_facility_tag(body.model_dump())
    return success_envelope(FacilityTagRow.model_validate(data), request)


@router.patch("/facility-tags/{tag_id}")
async def admin_update_facility_tag(
    tag_id: UUID,
    body: FacilityTagUpdate,
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await AdminCustomerExperienceService(session).update_facility_tag(tag_id, body.model_dump(exclude_unset=True))
    return success_envelope(FacilityTagRow.model_validate(data), request)


@router.get("/storefronts/pending")
async def admin_pending_storefronts(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await AdminCustomerExperienceService(session).list_pending_storefronts()
    return success_envelope(data, request)


@router.post("/storefronts/{laundry_id}/approve")
async def admin_approve_storefront(
    laundry_id: UUID,
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await AdminCustomerExperienceService(session).approve_storefront(laundry_id)
    return success_envelope(data, request)


@router.post("/storefronts/{laundry_id}/reject")
async def admin_reject_storefront(
    laundry_id: UUID,
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await AdminCustomerExperienceService(session).reject_storefront(laundry_id)
    return success_envelope(data, request)


@router.get("/questions")
async def admin_list_questions(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
    status: str | None = Query(default=None),
) -> dict:
    data = await AdminCustomerExperienceService(session).list_questions(status=status)
    return success_envelope([QuestionRow.model_validate(r) for r in data], request)


@router.post("/questions/{question_id}/moderate")
async def admin_moderate_question(
    question_id: UUID,
    body: ModerateQuestionRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await AdminCustomerExperienceService(session).moderate_question(
        question_id,
        action=body.action,
        actor_id=UUID(payload["sub"]),
    )
    return success_envelope(data, request)
