"""Customer orders."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_user_payload
from app.schemas.order import (
    OrderCreateRequest,
    OrderDetailResponse,
    OrderListItemResponse,
    OrderResponse,
    OrderStatusEventResponse,
)
from app.schemas.delivery_proof import DeliveryProofPhotoResponse
from app.schemas.pickup_evidence import PickupEvidencePhotoResponse
from app.services.custody_event_service import CustodyEventService
from app.services.delivery_otp_service import DeliveryOtpService
from app.services.delivery_proof_service import DeliveryProofService
from app.services.inventory_verification_service import InventoryVerificationService
from app.services.order_service import OrderService
from app.services.pickup_evidence_service import PickupEvidenceService

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", status_code=201)
async def create_order(
    body: OrderCreateRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_user_payload)],
) -> dict:
    order = await OrderService(session).create_order(
        UUID(payload["sub"]),
        laundry_id=body.laundry_id,
        address_id=body.address_id,
        pickup_at=body.pickup_at,
        delivery_at=body.delivery_at,
        items=[i.model_dump() for i in body.items],
        notes=body.notes,
    )
    return success_envelope(OrderResponse.model_validate(order), request)


@router.get("")
async def list_orders(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_user_payload)],
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0),
) -> dict:
    rows = await OrderService(session).list_for_user(
        UUID(payload["sub"]),
        limit=limit,
        offset=offset,
    )
    data = [OrderListItemResponse.model_validate(r) for r in rows]
    return success_envelope(data, request)


def _pickup_photo_response(photo) -> PickupEvidencePhotoResponse:
    return PickupEvidencePhotoResponse(
        id=photo.id,
        order_id=photo.order_id,
        customer_id=photo.customer_id,
        laundry_id=photo.laundry_id,
        captured_at=photo.captured_at,
        latitude=photo.latitude,
        longitude=photo.longitude,
        uploaded_by_user_id=photo.uploaded_by_user_id,
        sort_index=photo.sort_index,
        created_at=photo.created_at,
        original_url=PickupEvidenceService.media_url(photo.id, variant="original"),
        compressed_url=PickupEvidenceService.media_url(photo.id, variant="compressed"),
    )


def _delivery_proof_response(photo) -> DeliveryProofPhotoResponse:
    return DeliveryProofPhotoResponse(
        id=photo.id,
        order_id=photo.order_id,
        customer_id=photo.customer_id,
        laundry_id=photo.laundry_id,
        captured_at=photo.captured_at,
        latitude=photo.latitude,
        longitude=photo.longitude,
        uploaded_by_user_id=photo.uploaded_by_user_id,
        device_info=photo.device_info,
        created_at=photo.created_at,
        original_url=DeliveryProofService.media_url(photo.id, variant="original"),
        compressed_url=DeliveryProofService.media_url(photo.id, variant="compressed"),
    )


@router.get("/{order_id}")
async def get_order(
    order_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_user_payload)],
) -> dict:
    user_id = UUID(payload["sub"])
    order = await OrderService(session).get_for_user(user_id, order_id)
    events = await OrderService(session).list_events(user_id, order_id)
    photos = await PickupEvidenceService(session).list_for_customer(user_id, order_id)
    inventory = await InventoryVerificationService(session).get_for_customer(user_id, order_id)
    delivery = await DeliveryOtpService(session).get_status_for_order(order_id)
    proof = await DeliveryProofService(session).get_for_customer(user_id, order_id)
    custody = await CustodyEventService(session).get_timeline_for_customer(user_id, order_id)
    body = OrderDetailResponse.model_validate(order)
    body.events = [OrderStatusEventResponse.model_validate(e) for e in events]
    body.pickup_evidence = [_pickup_photo_response(p) for p in photos]
    body.inventory_verification = inventory
    body.delivery_verification = delivery
    body.delivery_proof = _delivery_proof_response(proof) if proof else None
    body.custody_timeline = custody
    return success_envelope(body, request)


@router.get("/{order_id}/events")
async def list_order_events(
    order_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_user_payload)],
) -> dict:
    events = await OrderService(session).list_events(UUID(payload["sub"]), order_id)
    data = [OrderStatusEventResponse.model_validate(e) for e in events]
    return success_envelope(data, request)
