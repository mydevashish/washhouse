"""Delivery proof business logic."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from decimal import Decimal
from pathlib import Path
from uuid import UUID, uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import AuthorizationError, ConflictError, NotFoundError, ValidationError
from app.models.delivery_proof import DeliveryProofPhoto
from app.models.enums import CustodyActorRole, CustodyEventType, OrderStatus
from app.models.order import OrderStatusEvent
from app.repositories.delivery_proof import DeliveryProofRepository
from app.repositories.laundry import LaundryRepository
from app.repositories.order import OrderRepository
from app.services.custody_event_service import CustodyEventService
from app.services.image_processing import (
    extension_for_content_type,
    validate_image_bytes,
    write_compressed,
    write_original,
)
from app.services.order_events import publish_order_status_update

UPLOADABLE_STATUSES = {OrderStatus.out_for_delivery}
DELIVERY_PROOF_TIMELINE_NOTE = "Delivery proof uploaded"


class DeliveryProofService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._orders = OrderRepository(session)
        self._laundries = LaundryRepository(session)
        self._proof = DeliveryProofRepository(session)

    async def upload_for_partner(
        self,
        agent_user_id: UUID,
        order_id: UUID,
        *,
        raw: bytes,
        content_type: str | None,
        captured_at: datetime | None,
        latitude: float | None,
        longitude: float | None,
        device_info: dict | None,
    ) -> DeliveryProofPhoto:
        order, _ = await self._require_partner_order(agent_user_id, order_id)
        if order.status not in UPLOADABLE_STATUSES:
            raise ValidationError("Delivery proof can only be uploaded when order is out for delivery")

        existing = await self._proof.get_by_order(order_id)
        if existing:
            raise ConflictError("Delivery proof already uploaded for this order")

        try:
            validate_image_bytes(raw, content_type)
        except ValueError as exc:
            raise ValidationError(str(exc)) from exc

        if latitude is not None and (latitude < -90 or latitude > 90):
            raise ValidationError("Invalid latitude")
        if longitude is not None and (longitude < -180 or longitude > 180):
            raise ValidationError("Invalid longitude")

        when = captured_at or datetime.now(UTC)
        if when.tzinfo is None:
            when = when.replace(tzinfo=UTC)

        photo_id = uuid4()
        ext = extension_for_content_type(content_type)
        base_dir = settings.delivery_proof_upload_path / str(order.id)
        original_path = base_dir / str(photo_id) / f"original{ext}"
        compressed_path = base_dir / str(photo_id) / "compressed.jpg"
        write_original(raw, original_path)
        write_compressed(raw, compressed_path)

        row = DeliveryProofPhoto(
            id=photo_id,
            order_id=order.id,
            customer_id=order.user_id,
            laundry_id=order.laundry_id,
            original_storage_key=f"{order.id}/{photo_id}/original{ext}",
            compressed_storage_key=f"{order.id}/{photo_id}/compressed.jpg",
            captured_at=when,
            latitude=Decimal(str(latitude)) if latitude is not None else None,
            longitude=Decimal(str(longitude)) if longitude is not None else None,
            uploaded_by_user_id=agent_user_id,
            device_info=device_info,
        )
        saved = await self._proof.save(row)

        event = OrderStatusEvent(
            order_id=order.id,
            status=order.status,
            note=DELIVERY_PROOF_TIMELINE_NOTE,
        )
        await self._orders.add_event(event)
        await publish_order_status_update(order, event)
        await CustodyEventService(self._session).record(
            order.id,
            CustodyEventType.delivery_proof_uploaded,
            actor_user_id=agent_user_id,
            actor_role=CustodyActorRole.partner,
            metadata={
                "latitude": float(latitude) if latitude is not None else None,
                "longitude": float(longitude) if longitude is not None else None,
                "device_info": device_info,
            },
        )
        return saved

    async def get_for_customer(self, user_id: UUID, order_id: UUID) -> DeliveryProofPhoto | None:
        order = await self._orders.get_by_id(order_id)
        if not order or order.user_id != user_id:
            raise NotFoundError("Order not found")
        return await self._proof.get_by_order(order_id)

    async def get_for_partner(self, partner_user_id: UUID, order_id: UUID) -> DeliveryProofPhoto | None:
        await self._require_partner_order(partner_user_id, order_id)
        return await self._proof.get_by_order(order_id)

    async def get_for_admin(self, order_id: UUID) -> DeliveryProofPhoto | None:
        order = await self._orders.get_by_id(order_id)
        if not order:
            raise NotFoundError("Order not found")
        return await self._proof.get_by_order(order_id)

    async def get_photo_for_viewer(
        self,
        photo_id: UUID,
        *,
        user_id: UUID,
        role: str,
        variant: str = "compressed",
    ) -> tuple[DeliveryProofPhoto, Path, str]:
        from sqlalchemy import select

        from app.models.delivery_proof import DeliveryProofPhoto as Model

        result = await self._session.execute(select(Model).where(Model.id == photo_id))
        photo = result.scalar_one_or_none()
        if not photo:
            raise NotFoundError("Photo not found")
        order = await self._orders.get_by_id(photo.order_id)
        if not order:
            raise NotFoundError("Photo not found")
        await self._assert_can_view(order, photo, user_id=user_id, role=role)
        if variant == "original":
            ext = Path(photo.original_storage_key).suffix.lower()
            content_type = {
                ".jpg": "image/jpeg",
                ".jpeg": "image/jpeg",
                ".png": "image/png",
                ".webp": "image/webp",
            }.get(ext, "application/octet-stream")
            path = settings.delivery_proof_upload_path / photo.original_storage_key
        else:
            content_type = "image/jpeg"
            path = settings.delivery_proof_upload_path / photo.compressed_storage_key
        if not path.is_file():
            raise NotFoundError("Photo file not found")
        return photo, path, content_type

    async def has_proof(self, order_id: UUID) -> bool:
        return (await self._proof.get_by_order(order_id)) is not None

    async def _require_partner_order(self, partner_user_id: UUID, order_id: UUID):
        laundry = await self._laundries.get_by_owner(partner_user_id)
        if not laundry:
            raise NotFoundError("Partner laundry not found")
        order = await self._orders.get_by_id(order_id)
        if not order or order.laundry_id != laundry.id:
            raise NotFoundError("Order not found")
        return order, laundry

    async def _assert_can_view(self, order, photo: DeliveryProofPhoto, *, user_id: UUID, role: str) -> None:
        if role in ("admin", "super_admin"):
            return
        if role == "customer" and order.user_id == user_id:
            return
        if role == "partner":
            laundry = await self._laundries.get_by_owner(user_id)
            if laundry and order.laundry_id == laundry.id:
                return
        if role == "delivery":
            laundry = await self._laundries.get_by_owner(user_id)
            if laundry and order.laundry_id == laundry.id:
                return
        raise AuthorizationError()

    @staticmethod
    def media_url(photo_id: UUID, *, variant: str = "compressed") -> str:
        suffix = "original" if variant == "original" else "compressed"
        return f"/api/v1/delivery-proof/photos/{photo_id}/{suffix}"

    @staticmethod
    def parse_device_info(raw: str | None) -> dict | None:
        if not raw:
            return None
        try:
            parsed = json.loads(raw)
            return parsed if isinstance(parsed, dict) else None
        except json.JSONDecodeError:
            return None
