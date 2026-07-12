"""Admin fraud detection APIs."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Request

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_admin
from app.models.enums import FraudAlertStatus, FraudSubjectType
from app.services.fraud_detection_service import FraudDetectionService

router = APIRouter(prefix="/admin/fraud", tags=["fraud-detection"])


@router.get("/alerts")
async def list_fraud_alerts(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
    status: FraudAlertStatus | None = None,
    risk_level: str | None = None,
    subject_type: FraudSubjectType | None = None,
) -> dict:
    data = await FraudDetectionService(session).list_alerts_admin(
        status=status,
        risk_level=risk_level,
        subject_type=subject_type,
    )
    return success_envelope(data, request)


@router.get("/alerts/{alert_id}")
async def get_fraud_alert(
    alert_id: UUID,
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await FraudDetectionService(session).get_alert_admin(alert_id)
    return success_envelope(data, request)


@router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_fraud_alert(
    alert_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await FraudDetectionService(session).acknowledge_alert(UUID(payload["sub"]), alert_id)
    return success_envelope(data, request)


@router.post("/alerts/{alert_id}/resolve")
async def resolve_fraud_alert(
    alert_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await FraudDetectionService(session).resolve_alert(UUID(payload["sub"]), alert_id)
    return success_envelope(data, request)


@router.get("/summary")
async def fraud_risk_summary(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await FraudDetectionService(session).risk_summary()
    return success_envelope(data, request)


@router.post("/evaluate/customer/{user_id}")
async def evaluate_customer_fraud(
    user_id: UUID,
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await FraudDetectionService(session).evaluate_customer(user_id)
    return success_envelope(data, request)


@router.post("/evaluate/partner/{laundry_id}")
async def evaluate_partner_fraud(
    laundry_id: UUID,
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await FraudDetectionService(session).evaluate_partner(laundry_id)
    return success_envelope(data, request)
