"""Platform configuration center API."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_admin, get_current_user_payload
from app.core.config import settings
from app.schemas.platform_config import (
    CommissionDefaultUpdate,
    ConfigAuditRow,
    DisputeSettingsUpdate,
    LaundryCommissionUpdate,
    NotificationSettingsUpdate,
    OrderSettingsUpdate,
    PartnerCommissionUpdate,
    PlatformConfigResponse,
    SessionSettingsUpdate,
)
from app.services.platform_config_service import PlatformConfigService

router = APIRouter(prefix="/admin/platform-config", tags=["admin-platform-config"])


@router.get("")
async def get_platform_config(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await PlatformConfigService(session).get_full_config()
    return success_envelope(PlatformConfigResponse.model_validate(data), request)


@router.get("/audit")
async def list_config_audit(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
    limit: int = Query(default=50, ge=1, le=200),
) -> dict:
    rows = await PlatformConfigService(session).list_config_audit(limit=limit)
    data = [
        ConfigAuditRow(
            id=r["id"],
            timestamp=r["timestamp"].isoformat() if hasattr(r["timestamp"], "isoformat") else str(r["timestamp"]),
            user_name=r["user_name"],
            user_email=r["user_email"],
            category=(r.get("metadata") or {}).get("category"),
            key=(r.get("metadata") or {}).get("key"),
            old_value=r.get("old_value"),
            new_value=r.get("new_value"),
            action=r["action"],
        )
        for r in rows
    ]
    return success_envelope(data, request)


@router.put("/commission/default")
async def update_default_commission(
    body: CommissionDefaultUpdate,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await PlatformConfigService(session).update_commission_default(
        body.rate,
        actor_user_id=UUID(payload["sub"]),
    )
    return success_envelope(data, request)


@router.patch("/commission/laundry/{laundry_id}")
async def update_laundry_commission(
    laundry_id: UUID,
    body: LaundryCommissionUpdate,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await PlatformConfigService(session).set_laundry_commission(
        laundry_id,
        body.rate,
        actor_user_id=UUID(payload["sub"]),
    )
    return success_envelope(data, request)


@router.put("/commission/partner")
async def set_partner_commission(
    body: PartnerCommissionUpdate,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await PlatformConfigService(session).set_partner_commission(
        user_id=body.user_id,
        email=str(body.email) if body.email else None,
        rate=body.rate,
        actor_user_id=UUID(payload["sub"]),
    )
    return success_envelope(data, request)


@router.delete("/commission/partner/{user_id}")
async def remove_partner_commission(
    user_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    await PlatformConfigService(session).remove_partner_commission(
        user_id,
        actor_user_id=UUID(payload["sub"]),
    )
    return success_envelope({"removed": True}, request)


@router.put("/order")
async def update_order_settings(
    body: OrderSettingsUpdate,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await PlatformConfigService(session).update_order_settings(
        min_amount_inr=body.min_amount_inr,
        max_amount_inr=body.max_amount_inr,
        pickup_radius_km=body.pickup_radius_km,
        delivery_radius_km=body.delivery_radius_km,
        actor_user_id=UUID(payload["sub"]),
    )
    return success_envelope(data, request)


@router.put("/dispute")
async def update_dispute_settings(
    body: DisputeSettingsUpdate,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await PlatformConfigService(session).update_dispute_settings(
        dispute_window_hours=body.dispute_window_hours,
        refund_window_hours=body.refund_window_hours,
        sla_hours=body.sla_hours,
        actor_user_id=UUID(payload["sub"]),
    )
    return success_envelope(data, request)


@router.put("/session")
async def update_session_settings(
    body: SessionSettingsUpdate,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await PlatformConfigService(session).update_session_settings(
        idle_timeout_minutes=body.idle_timeout_minutes,
        warning_timeout_minutes=body.warning_timeout_minutes,
        actor_user_id=UUID(payload["sub"]),
    )
    return success_envelope(data, request)


@router.put("/notifications")
async def update_notification_settings(
    body: NotificationSettingsUpdate,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await PlatformConfigService(session).update_notification_settings(
        email_enabled=body.email_enabled,
        sms_enabled=body.sms_enabled,
        push_enabled=body.push_enabled,
        in_app_enabled=body.in_app_enabled,
        actor_user_id=UUID(payload["sub"]),
    )
    return success_envelope(data, request)


public_router = APIRouter(prefix="/config", tags=["platform-config-public"])


@public_router.get("")
async def public_app_config(request: Request) -> dict:
    return success_envelope(
        {"online_booking_enabled": settings.FEATURE_ONLINE_BOOKING},
        request,
    )


@public_router.get("/session")
async def public_session_config(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_user_payload)],
) -> dict:
    data = await PlatformConfigService(session).get_public_session_config()
    return success_envelope(data, request)
