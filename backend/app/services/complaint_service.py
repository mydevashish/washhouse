"""Dispute management business logic."""

from __future__ import annotations

from pathlib import Path
from uuid import UUID, uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import AuthorizationError, NotFoundError, ValidationError
from app.models.complaint import Complaint
from app.models.complaint_photo import ComplaintPhoto
from app.models.complaint_status_event import ComplaintStatusEvent
from app.models.enums import ComplaintStatus, ComplaintType, CustodyActorRole, DisputePriority
from app.repositories.complaint import ComplaintRepository
from app.repositories.order import OrderRepository
from app.repositories.user import UserRepository
from app.schemas.complaint import (
    DISPUTE_STATUS_LABELS,
    DISPUTE_TYPE_LABELS,
    ComplaintDetailResponse,
    ComplaintListItemResponse,
    ComplaintPhotoResponse,
    ComplaintStatusEventResponse,
)
from app.schemas.custody_event import CustodyTimelineResponse
from app.schemas.delivery_otp import DeliveryVerificationStatusResponse
from app.schemas.delivery_proof import DeliveryProofPhotoResponse
from app.schemas.inventory_verification import InventoryVerificationResponse
from app.schemas.pickup_evidence import PickupEvidencePhotoResponse
from app.services.custody_event_service import CustodyEventService
from app.services.delivery_otp_service import DeliveryOtpService
from app.services.delivery_proof_service import DeliveryProofService
from app.services.image_processing import (
    extension_for_content_type,
    validate_image_bytes,
    write_compressed,
    write_original,
)
from app.services.inventory_verification_service import InventoryVerificationService
from app.services.pickup_evidence_service import PickupEvidenceService
from app.services.trust_score_service import TrustScoreService
from app.services.laundry_trust_score_service import LaundryTrustScoreService
from app.services.fraud_detection_service import FraudDetectionService

MAX_DISPUTE_PHOTOS = 5


class ComplaintService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._complaints = ComplaintRepository(session)
        self._orders = OrderRepository(session)
        self._users = UserRepository(session)

    async def create_dispute(
        self,
        user_id: UUID,
        *,
        order_id: UUID,
        complaint_type: ComplaintType,
        description: str,
        files: list[tuple[bytes, str | None]],
    ) -> Complaint:
        if not description.strip():
            raise ValidationError("Notes are required")
        if len(files) > MAX_DISPUTE_PHOTOS:
            raise ValidationError(f"Maximum {MAX_DISPUTE_PHOTOS} photos allowed")

        order = await self._orders.get_by_id(order_id)
        if not order or order.user_id != user_id:
            raise NotFoundError("Order not found")

        row = Complaint(
            user_id=user_id,
            order_id=order_id,
            complaint_type=complaint_type,
            description=description.strip(),
            status=ComplaintStatus.open,
            priority=DisputePriority.high
            if complaint_type == ComplaintType.refund_request
            else DisputePriority.medium,
        )
        await self._complaints.save(row)

        await self._complaints.add_status_event(
            ComplaintStatusEvent(
                complaint_id=row.id,
                status=ComplaintStatus.open,
                actor_user_id=user_id,
                actor_role=CustodyActorRole.customer,
                note="Dispute filed",
            ),
        )

        if files:
            photos = await self._persist_photos(row.id, user_id, files)
            await self._complaints.add_photos(photos)

        await TrustScoreService(self._session).on_dispute_filed(user_id, row.id, complaint_type)
        await LaundryTrustScoreService(self._session).recalculate_for_order(order_id)
        await FraudDetectionService(self._session).on_dispute_filed(user_id, order_id)

        from app.services.settlement_service import SettlementService
        await SettlementService(self._session).on_complaint_opened(order_id)

        return row

    async def list_for_customer(self, user_id: UUID) -> list[ComplaintListItemResponse]:
        rows = await self._complaints.list_by_user(user_id)
        return [await self._to_list_item(row) for row in rows]

    async def list_for_admin(self) -> list[ComplaintListItemResponse]:
        rows = await self._complaints.list_all()
        return [await self._to_list_item(row, include_customer=True) for row in rows]

    async def get_for_customer(self, user_id: UUID, complaint_id: UUID) -> ComplaintDetailResponse:
        row = await self._complaints.get_by_id(complaint_id)
        if not row or row.user_id != user_id:
            raise NotFoundError("Dispute not found")
        return await self._to_detail(row, user_id=user_id, include_full_evidence=False)

    async def get_for_admin(self, complaint_id: UUID) -> ComplaintDetailResponse:
        row = await self._complaints.get_by_id(complaint_id)
        if not row:
            raise NotFoundError("Dispute not found")
        return await self._to_detail(row, user_id=row.user_id, include_full_evidence=True)

    async def update_status_admin(
        self,
        admin_user_id: UUID,
        complaint_id: UUID,
        *,
        status: ComplaintStatus,
        admin_notes: str | None,
        note: str | None,
    ) -> ComplaintDetailResponse:
        row = await self._complaints.get_by_id(complaint_id)
        if not row:
            raise NotFoundError("Dispute not found")

        row.status = status
        if admin_notes is not None:
            row.admin_notes = admin_notes.strip() or None
        if status in (ComplaintStatus.resolved, ComplaintStatus.rejected, ComplaintStatus.closed):
            from datetime import UTC, datetime

            row.resolved_at = datetime.now(UTC)
        await self._complaints.save(row)

        await self._complaints.add_status_event(
            ComplaintStatusEvent(
                complaint_id=row.id,
                status=status,
                actor_user_id=admin_user_id,
                actor_role=CustodyActorRole.admin,
                note=note,
            ),
        )
        if status == ComplaintStatus.rejected:
            await TrustScoreService(self._session).on_dispute_rejected(row.user_id, row.id)
        await LaundryTrustScoreService(self._session).recalculate_for_order(row.order_id)
        if row.order_id:
            order = await self._orders.get_by_id(row.order_id)
            if order:
                await FraudDetectionService(self._session).evaluate_partner(order.laundry_id)
        return await self._to_detail(row, user_id=row.user_id, include_full_evidence=True)

    async def get_photo_for_viewer(
        self,
        photo_id: UUID,
        *,
        user_id: UUID,
        role: str,
        variant: str = "compressed",
    ) -> tuple[ComplaintPhoto, Path, str]:
        photo = await self._complaints.get_photo(photo_id)
        if not photo:
            raise NotFoundError("Photo not found")
        complaint = await self._complaints.get_by_id(photo.complaint_id)
        if not complaint:
            raise NotFoundError("Photo not found")
        await self._assert_can_view_complaint(complaint, user_id=user_id, role=role)

        if variant == "original":
            ext = Path(photo.original_storage_key).suffix.lower()
            content_type = {
                ".jpg": "image/jpeg",
                ".jpeg": "image/jpeg",
                ".png": "image/png",
                ".webp": "image/webp",
            }.get(ext, "application/octet-stream")
            path = settings.dispute_upload_path / photo.original_storage_key
        else:
            content_type = "image/jpeg"
            path = settings.dispute_upload_path / photo.compressed_storage_key
        if not path.is_file():
            raise NotFoundError("Photo file not found")
        return photo, path, content_type

    async def _persist_photos(
        self,
        complaint_id: UUID,
        user_id: UUID,
        files: list[tuple[bytes, str | None]],
    ) -> list[ComplaintPhoto]:
        photos: list[ComplaintPhoto] = []
        base_dir = settings.dispute_upload_path / str(complaint_id)
        for index, (raw, content_type) in enumerate(files):
            try:
                validate_image_bytes(raw, content_type)
            except ValueError as exc:
                raise ValidationError(str(exc)) from exc
            photo_id = uuid4()
            ext = extension_for_content_type(content_type)
            write_original(raw, base_dir / str(photo_id) / f"original{ext}")
            write_compressed(raw, base_dir / str(photo_id) / "compressed.jpg")
            photos.append(
                ComplaintPhoto(
                    id=photo_id,
                    complaint_id=complaint_id,
                    original_storage_key=f"{complaint_id}/{photo_id}/original{ext}",
                    compressed_storage_key=f"{complaint_id}/{photo_id}/compressed.jpg",
                    uploaded_by_user_id=user_id,
                    sort_index=index,
                ),
            )
        return photos

    async def _to_list_item(self, row: Complaint, *, include_customer: bool = False) -> ComplaintListItemResponse:
        tracking_code = None
        customer_name = None
        if row.order_id:
            order = await self._orders.get_by_id(row.order_id)
            if order:
                tracking_code = order.tracking_code
        if include_customer:
            user = await self._users.get_by_id(row.user_id)
            customer_name = user.full_name if user else None
        photos = await self._complaints.list_photos(row.id)
        return ComplaintListItemResponse(
            id=row.id,
            order_id=row.order_id,
            complaint_type=row.complaint_type,
            type_label=DISPUTE_TYPE_LABELS.get(row.complaint_type.value, row.complaint_type.value),
            description=row.description,
            status=row.status,
            status_label=DISPUTE_STATUS_LABELS.get(row.status.value, row.status.value),
            created_at=row.created_at,
            tracking_code=tracking_code,
            customer_name=customer_name,
            photo_count=len(photos),
        )

    async def _to_detail(
        self,
        row: Complaint,
        *,
        user_id: UUID,
        include_full_evidence: bool,
    ) -> ComplaintDetailResponse:
        tracking_code = None
        inventory = None
        history_count = 0
        pickup: list[PickupEvidencePhotoResponse] = []
        delivery_proof = None
        delivery_verification = None
        custody: CustodyTimelineResponse | None = None

        if row.order_id:
            order = await self._orders.get_by_id(row.order_id)
            tracking_code = order.tracking_code if order else None
            inventory = await InventoryVerificationService(self._session).get_for_customer(user_id, row.order_id)
            history = await InventoryVerificationService(self._session).list_history(row.order_id)
            history_count = len(history)

            if include_full_evidence:
                pickup_rows = await PickupEvidenceService(self._session).list_for_admin(row.order_id)
                proof_row = await DeliveryProofService(self._session).get_for_admin(row.order_id)
                uploader_ids = {p.uploaded_by_user_id for p in pickup_rows}
                if proof_row:
                    uploader_ids.add(proof_row.uploaded_by_user_id)
                uploader_names: dict[UUID, str] = {}
                for uid in uploader_ids:
                    user = await self._users.get_by_id(uid)
                    if user:
                        uploader_names[uid] = user.full_name or user.email or "Unknown"
                pickup = [self._pickup_photo(p, uploader_names.get(p.uploaded_by_user_id)) for p in pickup_rows]
                if proof_row:
                    delivery_proof = self._delivery_proof(proof_row, uploader_names.get(proof_row.uploaded_by_user_id))
                delivery_verification = await DeliveryOtpService(self._session).get_status_for_order(row.order_id)
                custody = await CustodyEventService(self._session).get_timeline_for_admin(row.order_id)
            else:
                proof_row = await DeliveryProofService(self._session).get_for_customer(user_id, row.order_id)
                if proof_row:
                    delivery_proof = self._delivery_proof(proof_row)

        photos = await self._complaints.list_photos(row.id)
        status_events = await self._complaints.list_status_events(row.id)
        actor_ids = {e.actor_user_id for e in status_events if e.actor_user_id}
        names: dict[UUID, str] = {}
        for uid in actor_ids:
            user = await self._users.get_by_id(uid)
            if user:
                names[uid] = user.full_name or user.email

        return ComplaintDetailResponse(
            id=row.id,
            order_id=row.order_id,
            complaint_type=row.complaint_type,
            type_label=DISPUTE_TYPE_LABELS.get(row.complaint_type.value, row.complaint_type.value),
            description=row.description,
            status=row.status,
            status_label=DISPUTE_STATUS_LABELS.get(row.status.value, row.status.value),
            created_at=row.created_at,
            tracking_code=tracking_code,
            admin_notes=row.admin_notes if include_full_evidence else None,
            photos=[self._photo_response(p) for p in photos],
            status_events=[
                ComplaintStatusEventResponse(
                    id=e.id,
                    complaint_id=e.complaint_id,
                    status=e.status,
                    status_label=DISPUTE_STATUS_LABELS.get(e.status.value, e.status.value),
                    actor_user_id=e.actor_user_id,
                    actor_role=e.actor_role,
                    actor_name=names.get(e.actor_user_id) if e.actor_user_id else None,
                    note=e.note,
                    created_at=e.created_at,
                )
                for e in status_events
            ],
            inventory_verification=inventory,
            inventory_history_count=history_count,
            pickup_evidence=pickup if include_full_evidence else [],
            delivery_proof=delivery_proof,
            delivery_verification=delivery_verification if include_full_evidence else None,
            custody_timeline=custody if include_full_evidence else None,
        )

    async def _assert_can_view_complaint(self, complaint: Complaint, *, user_id: UUID, role: str) -> None:
        if role in ("admin", "super_admin"):
            return
        if complaint.user_id == user_id:
            return
        raise AuthorizationError()

    @staticmethod
    def media_url(photo_id: UUID, *, variant: str = "compressed") -> str:
        suffix = "original" if variant == "original" else "compressed"
        return f"/api/v1/complaint-photos/{photo_id}/{suffix}"

    def _photo_response(self, photo: ComplaintPhoto) -> ComplaintPhotoResponse:
        return ComplaintPhotoResponse(
            id=photo.id,
            complaint_id=photo.complaint_id,
            sort_index=photo.sort_index,
            created_at=photo.created_at,
            original_url=self.media_url(photo.id, variant="original"),
            compressed_url=self.media_url(photo.id, variant="compressed"),
        )

    @staticmethod
    def _pickup_photo(photo, uploaded_by_name: str | None = None) -> PickupEvidencePhotoResponse:
        return PickupEvidencePhotoResponse(
            id=photo.id,
            order_id=photo.order_id,
            customer_id=photo.customer_id,
            laundry_id=photo.laundry_id,
            captured_at=photo.captured_at,
            latitude=photo.latitude,
            longitude=photo.longitude,
            uploaded_by_user_id=photo.uploaded_by_user_id,
            uploaded_by_name=uploaded_by_name,
            sort_index=photo.sort_index,
            created_at=photo.created_at,
            original_url=PickupEvidenceService.media_url(photo.id, variant="original"),
            compressed_url=PickupEvidenceService.media_url(photo.id, variant="compressed"),
        )

    @staticmethod
    def _delivery_proof(photo, uploaded_by_name: str | None = None) -> DeliveryProofPhotoResponse:
        return DeliveryProofPhotoResponse(
            id=photo.id,
            order_id=photo.order_id,
            customer_id=photo.customer_id,
            laundry_id=photo.laundry_id,
            captured_at=photo.captured_at,
            latitude=photo.latitude,
            longitude=photo.longitude,
            uploaded_by_user_id=photo.uploaded_by_user_id,
            uploaded_by_name=uploaded_by_name,
            device_info=photo.device_info,
            created_at=photo.created_at,
            original_url=DeliveryProofService.media_url(photo.id, variant="original"),
            compressed_url=DeliveryProofService.media_url(photo.id, variant="compressed"),
        )
