"""Customer experience public and authenticated APIs."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request

from app.api.utils import success_envelope
from app.api.v1.deps import (
    SessionDep,
    get_current_customer,
    get_current_partner,
    get_optional_user_payload,
)
from app.schemas.customer_experience import (
    CallbackRequestCreate,
    ContactInfoResponse,
    EngagementAnalytics,
    QuestionAnswerRequest,
    QuestionCreate,
    QuestionRow,
    ServiceCatalogItem,
    ServiceCategoryRow,
    TrackEngagementRequest,
)
from app.services.customer_experience_service import CustomerExperienceService

router = APIRouter(tags=["customer-experience"])


@router.get("/service-categories")
async def list_service_categories(request: Request, session: SessionDep) -> dict:
    data = await CustomerExperienceService(session).list_categories()
    return success_envelope([ServiceCategoryRow.model_validate(r) for r in data], request)


@router.get("/laundries/{laundry_id}/services/catalog")
async def browse_service_catalog(
    laundry_id: UUID,
    request: Request,
    session: SessionDep,
    q: str | None = Query(default=None, max_length=120),
    category: str | None = Query(default=None, max_length=80),
    express_only: bool = Query(default=False),
    sort: str = Query(default="popular", pattern="^(popular|price_asc|price_desc)$"),
) -> dict:
    data = await CustomerExperienceService(session).browse_services(
        laundry_id,
        q=q,
        category=category,
        express_only=express_only,
        sort=sort,
    )
    return success_envelope([ServiceCatalogItem.model_validate(r) for r in data], request)


@router.get("/laundries/{laundry_id}/services/{service_id}")
async def get_service_detail(
    laundry_id: UUID,
    service_id: UUID,
    request: Request,
    session: SessionDep,
) -> dict:
    data = await CustomerExperienceService(session).get_service_detail(laundry_id, service_id)
    return success_envelope(ServiceCatalogItem.model_validate(data), request)


@router.post("/laundries/{laundry_id}/engagement/store-view")
async def track_store_view(
    laundry_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict | None, Depends(get_optional_user_payload)] = None,
) -> dict:
    customer_id = UUID(payload["sub"]) if payload else None
    await CustomerExperienceService(session).record_store_view(laundry_id, customer_id=customer_id)
    return success_envelope({"tracked": True}, request)


@router.get("/laundries/{laundry_id}/contact")
async def get_contact_info(
    laundry_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict | None, Depends(get_optional_user_payload)] = None,
) -> dict:
    customer_id = UUID(payload["sub"]) if payload else None
    role = payload.get("role") if payload else None
    data = await CustomerExperienceService(session).get_contact_info(
        laundry_id,
        customer_id=customer_id,
        customer_role=role,
    )
    return success_envelope(ContactInfoResponse.model_validate(data), request)


@router.post("/laundries/{laundry_id}/contact/track")
async def track_contact_event(
    laundry_id: UUID,
    body: TrackEngagementRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict | None, Depends(get_optional_user_payload)] = None,
) -> dict:
    customer_id = UUID(payload["sub"]) if payload else None
    role = payload.get("role") if payload else None
    data = await CustomerExperienceService(session).track_contact(
        laundry_id,
        event_type=body.event_type,
        customer_id=customer_id,
        customer_role=role,
        service_id=body.service_id,
        source=body.source,
    )
    return success_envelope(ContactInfoResponse.model_validate(data), request)


@router.post("/laundries/{laundry_id}/callback")
async def request_callback(
    laundry_id: UUID,
    body: CallbackRequestCreate,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_customer)],
) -> dict:
    data = await CustomerExperienceService(session).request_callback(
        laundry_id,
        UUID(payload["sub"]),
        phone=body.phone,
        preferred_time=body.preferred_time,
    )
    return success_envelope(data, request)


@router.get("/laundries/{laundry_id}/questions")
async def list_public_questions(
    laundry_id: UUID,
    request: Request,
    session: SessionDep,
) -> dict:
    data = await CustomerExperienceService(session).list_public_questions(laundry_id)
    return success_envelope([QuestionRow.model_validate(r) for r in data], request)


@router.post("/laundries/{laundry_id}/questions")
async def ask_question(
    laundry_id: UUID,
    body: QuestionCreate,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_customer)],
) -> dict:
    data = await CustomerExperienceService(session).ask_question(
        laundry_id,
        UUID(payload["sub"]),
        body.question,
    )
    return success_envelope(QuestionRow.model_validate(data), request)


@router.get("/partner/engagement-analytics")
async def partner_engagement_analytics(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
    days: int = Query(default=30, ge=1, le=365),
) -> dict:
    data = await CustomerExperienceService(session).partner_engagement_analytics(UUID(payload["sub"]), days=days)
    return success_envelope(EngagementAnalytics.model_validate(data), request)


@router.get("/partner/questions")
async def partner_list_questions(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    data = await CustomerExperienceService(session).partner_list_questions(UUID(payload["sub"]))
    return success_envelope([QuestionRow.model_validate(r) for r in data], request)


@router.post("/partner/questions/{question_id}/answer")
async def partner_answer_question(
    question_id: UUID,
    body: QuestionAnswerRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    data = await CustomerExperienceService(session).partner_answer_question(
        UUID(payload["sub"]),
        question_id,
        body.answer,
    )
    return success_envelope(QuestionRow.model_validate(data), request)
