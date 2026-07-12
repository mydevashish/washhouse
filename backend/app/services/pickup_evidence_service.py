"""Pickup evidence business logic."""

from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from pathlib import Path
from uuid import UUID, uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import AuthorizationError, ConflictError, NotFoundError, ValidationError
from app.models.enums import CustodyActorRole, CustodyEventType, OrderStatus
from app.models.order import OrderStatusEvent
from app.models.pickup_evidence import PickupEvidencePhoto
from app.repositories.laundry import LaundryRepository
from app.repositories.order import OrderRepository
from app.repositories.pickup_evidence import PickupEvidenceRepository
from app.services.custody_event_service import CustodyEventService
from app.services.image_processing import (
    extension_for_content_type,
    validate_image_bytes,
    write_compressed,
    write_original,
)
from app.services.order_events import publish_order_status_update

MAX_PHOTOS_PER_ORDER = 10
MIN_PHOTOS_PER_UPLOAD = 1
UPLOADABLE_STATUSES = {OrderStatus.confirmed, OrderStatus.pickup_assigned}
PICKUP_TIMELINE_NOTE = "Pickup photos uploaded"


class PickupEvidenceService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._orders = OrderRepository(session)
        self._laundries = LaundryRepository(session)
        self._evidence = PickupEvidenceRepository(session)

    async def upload_for_partner(
        self,
        actor_user_id: UUID,
        order_id: UUID,
        *,
        files: list[tuple[bytes, str | None]],
        captured_at: datetime | None,
        latitude: float | None,
        longitude: float | None,
    ) -> list[PickupEvidencePhoto]:
        order, laundry = await self._require_partner_order(actor_user_id, order_id)
        return await self._persist_upload(
            order=order,
            uploaded_by_user_id=actor_user_id,
            files=files,
            captured_at=captured_at,
            latitude=latitude,
            longitude=longitude,
        )

    async def list_for_customer(self, user_id: UUID, order_id: UUID) -> list[PickupEvidencePhoto]:
        order = await self._orders.get_by_id(order_id)
        if not order or order.user_id != user_id:
            raise NotFoundError("Order not found")
        return await self._evidence.list_by_order(order_id)

    async def list_for_partner(self, partner_user_id: UUID, order_id: UUID) -> list[PickupEvidencePhoto]:
        await self._require_partner_order(partner_user_id, order_id)
        return await self._evidence.list_by_order(order_id)

    async def list_for_admin(self, order_id: UUID) -> list[PickupEvidencePhoto]:
        order = await self._orders.get_by_id(order_id)
        if not order:
            raise NotFoundError("Order not found")
        return await self._evidence.list_by_order(order_id)

    async def get_photo_for_viewer(
        self,
        photo_id: UUID,
        *,
        user_id: UUID,
        role: str,
    ) -> tuple[PickupEvidencePhoto, Path, str]:
        photo = await self._evidence.get_by_id(photo_id)
        if not photo:
            raise NotFoundError("Photo not found")
        order = await self._orders.get_by_id(photo.order_id)
        if not order:
            raise NotFoundError("Photo not found")
        await self._assert_can_view(order, photo, user_id=user_id, role=role)
        return photo, self._resolve_storage_path(photo, variant="compressed"), "image/jpeg"

    async def get_photo_original_for_viewer(
        self,
        photo_id: UUID,
        *,
        user_id: UUID,
        role: str,
    ) -> tuple[PickupEvidencePhoto, Path, str]:
        photo = await self._evidence.get_by_id(photo_id)
        if not photo:
            raise NotFoundError("Photo not found")
        order = await self._orders.get_by_id(photo.order_id)
        if not order:
            raise NotFoundError("Photo not found")
        await self._assert_can_view(order, photo, user_id=user_id, role=role)
        ext = Path(photo.original_storage_key).suffix.lower()
        content_type = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
        }.get(ext, "application/octet-stream")
        return photo, self._resolve_storage_path(photo, variant="original"), content_type

    async def has_evidence(self, order_id: UUID) -> bool:
        return (await self._evidence.count_for_order(order_id)) > 0

    async def _persist_upload(
        self,
        *,
        order,
        uploaded_by_user_id: UUID,
        files: list[tuple[bytes, str | None]],
        captured_at: datetime | None,
        latitude: float | None,
        longitude: float | None,
    ) -> list[PickupEvidencePhoto]:
        if order.status not in UPLOADABLE_STATUSES:
            raise ValidationError("Pickup photos can only be uploaded before pickup is completed")
        existing = await self._evidence.count_for_order(order.id)
        if existing > 0:
            raise ConflictError("Pickup evidence already uploaded for this order")
        if len(files) < MIN_PHOTOS_PER_UPLOAD or len(files) > MAX_PHOTOS_PER_ORDER:
            raise ValidationError(f"Upload between {MIN_PHOTOS_PER_UPLOAD} and {MAX_PHOTOS_PER_ORDER} photos")

        when = captured_at or datetime.now(UTC)
        if when.tzinfo is None:
            when = when.replace(tzinfo=UTC)

        lat = Decimal(str(latitude)) if latitude is not None else None
        lng = Decimal(str(longitude)) if longitude is not None else None
        if latitude is not None and (latitude < -90 or latitude > 90):
            raise ValidationError("Invalid latitude")
        if longitude is not None and (longitude < -180 or longitude > 180):
            raise ValidationError("Invalid longitude")

        photos: list[PickupEvidencePhoto] = []
        base_dir = settings.pickup_evidence_upload_path / str(order.id)

        for index, (raw, content_type) in enumerate(files):
            try:
                validate_image_bytes(raw, content_type)
            except ValueError as exc:
                raise ValidationError(str(exc)) from exc

            photo_id = uuid4()
            ext = extension_for_content_type(content_type)
            original_key = f"{order.id}/{photo_id}/original{ext}"
            compressed_key = f"{order.id}/{photo_id}/compressed.jpg"
            original_path = base_dir / f"{photo_id}" / f"original{ext}"
            compressed_path = base_dir / f"{photo_id}" / "compressed.jpg"

            write_original(raw, original_path)
            write_compressed(raw, compressed_path)

            photos.append(
                PickupEvidencePhoto(
                    id=photo_id,
                    order_id=order.id,
                    customer_id=order.user_id,
                    laundry_id=order.laundry_id,
                    original_storage_key=original_key,
                    compressed_storage_key=compressed_key,
                    captured_at=when,
                    latitude=lat,
                    longitude=lng,
                    uploaded_by_user_id=uploaded_by_user_id,
                    sort_index=index,
                ),
            )

        saved = await self._evidence.add_many(photos)
        event = OrderStatusEvent(
            order_id=order.id,
            status=order.status,
            note=PICKUP_TIMELINE_NOTE,
        )
        await self._orders.add_event(event)
        await publish_order_status_update(order, event)
        await CustodyEventService(self._session).record(
            order.id,
            CustodyEventType.pickup_photos_uploaded,
            actor_user_id=uploaded_by_user_id,
            actor_role=CustodyActorRole.partner,
            metadata={
                "photo_count": len(saved),
                "latitude": float(lat) if lat is not None else None,
                "longitude": float(lng) if lng is not None else None,
            },
        )
        return saved

    async def _require_partner_order(self, partner_user_id: UUID, order_id: UUID):
        laundry = await self._laundries.get_by_owner(partner_user_id)
        if not laundry:
            raise NotFoundError("Partner laundry not found")
        order = await self._orders.get_by_id(order_id)
        if not order or order.laundry_id != laundry.id:
            raise NotFoundError("Order not found")
        return order, laundry

    async def _assert_can_view(self, order, photo: PickupEvidencePhoto, *, user_id: UUID, role: str) -> None:
        if role in ("admin", "super_admin"):
            return
        if role == "customer" and order.user_id == user_id:
            return
        if role == "partner":
            laundry = await self._laundries.get_by_owner(user_id)
            if laundry and order.laundry_id == laundry.id and photo.laundry_id == laundry.id:
                return
        if role == "delivery":
            laundry = await self._laundries.get_by_owner(user_id)
            if laundry and order.laundry_id == laundry.id:
                return
        raise AuthorizationError()

    def _resolve_storage_path(self, photo: PickupEvidencePhoto, *, variant: str) -> Path:
        key = photo.original_storage_key if variant == "original" else photo.compressed_storage_key
        path = settings.pickup_evidence_upload_path / key
        if not path.is_file():
            raise NotFoundError("Photo file not found")
        return path

    @staticmethod
    def media_url(photo_id: UUID, *, variant: str = "compressed") -> str:
        suffix = "original" if variant == "original" else "compressed"
        return f"/api/v1/pickup-evidence/photos/{photo_id}/{suffix}"
