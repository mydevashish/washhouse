"""Subscription plans."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Request
from sqlalchemy import select

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_user_payload
from app.models.subscription import SubscriptionPlan

router = APIRouter(prefix="/subscription-plans", tags=["subscriptions"])


@router.get("")
async def list_plans(request: Request, session: SessionDep) -> dict:
    result = await session.execute(
        select(SubscriptionPlan).where(SubscriptionPlan.is_active.is_(True)),
    )
    plans = result.scalars().all()
    return success_envelope(
        [
            {
                "id": str(p.id),
                "slug": p.slug,
                "name": p.name,
                "price_inr": str(p.price_inr),
                "discount_percent": str(p.discount_percent),
            }
            for p in plans
        ],
        request,
    )


@router.post("/subscribe")
async def subscribe(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_user_payload)],
) -> dict:
    return success_envelope(
        {"message": "Subscription checkout — wire Razorpay per ADR-002", "user_id": payload["sub"]},
        request,
    )
