"""Delivery OTP generation, verification, and account lockout."""

from __future__ import annotations

import secrets
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.delivery_otp_crypto import decrypt_otp, encrypt_otp
from app.core.exceptions import AuthenticationError, ConflictError, NotFoundError, ValidationError
from app.core.security import hash_password, verify_password
from app.models.delivery_otp import OrderDeliveryOtp
from app.models.enums import AuditAction, CustodyActorRole, CustodyEventType, DeliveryOtpStatus, OrderStatus
from app.models.order import OrderStatusEvent
from app.repositories.audit import AuditRepository
from app.repositories.delivery_otp import DeliveryOtpRepository
from app.repositories.laundry import LaundryRepository
from app.repositories.order import OrderRepository
from app.repositories.user import UserRepository
from app.schemas.delivery_otp import (
    CustomerDeliveryOtpResponse,
    DeliveryVerificationStatusResponse,
    DeliveryVerifyCompleteResponse,
)
from app.services.delivery_proof_service import DeliveryProofService
from app.services.custody_event_service import CustodyEventService
from app.services.trust_score_service import TrustScoreService
from app.services.laundry_trust_score_service import LaundryTrustScoreService
from app.services.fraud_detection_service import FraudDetectionService
from app.services.order_events import publish_order_status_update

OTP_LENGTH = 6
OTP_EXPIRY_HOURS = 24
MAX_FAILED_PER_ORDER = 5
MAX_FAILED_PER_AGENT = 10
AGENT_LOCK_MINUTES = 30
DELIVERY_OTP_GENERATED_NOTE = "Delivery OTP sent to customer"
DELIVERY_OTP_VERIFIED_NOTE = "Delivery verified with OTP"


class DeliveryOtpService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._orders = OrderRepository(session)
        self._laundries = LaundryRepository(session)
        self._users = UserRepository(session)
        self._otps = DeliveryOtpRepository(session)
        self._audit = AuditRepository(session)

    async def generate_for_order(self, order_id: UUID) -> tuple[OrderDeliveryOtp, str]:
        order = await self._orders.get_by_id(order_id)
        if not order:
            raise NotFoundError("Order not found")
        if order.status != OrderStatus.out_for_delivery:
            raise ValidationError("Delivery OTP is generated only when order is out for delivery")

        existing = await self._otps.get_by_order(order_id)
        if existing and existing.status == DeliveryOtpStatus.verified:
            raise ConflictError("Delivery already verified for this order")

        now = datetime.now(UTC)
        plain = f"{secrets.randbelow(10**OTP_LENGTH):0{OTP_LENGTH}d}"
        expires = now + timedelta(hours=OTP_EXPIRY_HOURS)

        if existing:
            existing.code_hash = hash_password(plain)
            existing.code_ciphertext = encrypt_otp(plain)
            existing.status = DeliveryOtpStatus.active
            existing.generated_at = now
            existing.expires_at = expires
            existing.failed_attempts = 0
            existing.verified_at = None
            existing.delivery_agent_user_id = None
            existing.verification_latitude = None
            existing.verification_longitude = None
            row = await self._otps.save(existing)
        else:
            row = OrderDeliveryOtp(
                order_id=order.id,
                customer_id=order.user_id,
                laundry_id=order.laundry_id,
                code_hash=hash_password(plain),
                code_ciphertext=encrypt_otp(plain),
                status=DeliveryOtpStatus.active,
                generated_at=now,
                expires_at=expires,
            )
            row = await self._otps.save(row)

        customer = await self._users.get_by_id(order.user_id)
        await self._audit.log(
            action=AuditAction.delivery_otp_generated,
            actor_user_id=None,
            resource_type="order",
            resource_id=str(order.id),
            metadata={
                "customer_id": str(order.user_id),
                "expires_at": expires.isoformat(),
                "phone": customer.phone if customer else None,
            },
        )

        event = OrderStatusEvent(
            order_id=order.id,
            status=order.status,
            note=DELIVERY_OTP_GENERATED_NOTE,
        )
        await self._orders.add_event(event)
        await publish_order_status_update(order, event)

        return row, plain

    async def get_customer_otp(self, user_id: UUID, order_id: UUID) -> CustomerDeliveryOtpResponse:
        order = await self._orders.get_by_id(order_id)
        if not order or order.user_id != user_id:
            raise NotFoundError("Order not found")
        row = await self._otps.get_by_order(order_id)
        if not row:
            raise NotFoundError("Delivery OTP not yet generated")
        self._refresh_expiry(row)
        if row.status != DeliveryOtpStatus.active:
            raise NotFoundError("Delivery OTP is not active")
        if not row.code_ciphertext:
            raise NotFoundError("Delivery OTP unavailable")

        plain = decrypt_otp(row.code_ciphertext)
        return CustomerDeliveryOtpResponse(
            order_id=order_id,
            otp_code=plain,
            expires_at=row.expires_at,
            status=row.status,
        )

    async def get_status_for_order(self, order_id: UUID) -> DeliveryVerificationStatusResponse | None:
        row = await self._otps.get_by_order(order_id)
        if not row:
            return None
        self._refresh_expiry(row)
        return DeliveryVerificationStatusResponse(
            order_id=row.order_id,
            status=row.status,
            generated_at=row.generated_at,
            expires_at=row.expires_at,
            verified_at=row.verified_at,
            delivery_agent_user_id=row.delivery_agent_user_id,
            verification_latitude=row.verification_latitude,
            verification_longitude=row.verification_longitude,
            failed_attempts=row.failed_attempts,
            is_verified=row.status == DeliveryOtpStatus.verified,
            otp_available=row.status == DeliveryOtpStatus.active,
        )

    async def verify_and_complete_delivery(
        self,
        agent_user_id: UUID,
        order_id: UUID,
        *,
        code: str,
        latitude: float | None,
        longitude: float | None,
    ) -> DeliveryVerifyCompleteResponse:
        await self._ensure_agent_not_locked(agent_user_id)
        order, _ = await self._require_agent_order(agent_user_id, order_id)

        if order.status != OrderStatus.out_for_delivery:
            raise ValidationError("Order must be out for delivery to verify OTP")

        if not await DeliveryProofService(self._session).has_proof(order_id):
            raise ValidationError("Delivery proof photo must be uploaded before completing delivery")

        row = await self._otps.get_by_order(order_id)
        if not row:
            raise ValidationError("Delivery OTP has not been generated")
        self._refresh_expiry(row)

        if row.status == DeliveryOtpStatus.verified:
            raise ConflictError("Delivery already verified")
        if row.status in (DeliveryOtpStatus.expired, DeliveryOtpStatus.locked):
            raise ValidationError("Delivery OTP is no longer valid")

        if not verify_password(code, row.code_hash):
            row.failed_attempts += 1
            agent = await self._users.get_by_id(agent_user_id)
            if agent:
                agent.delivery_otp_fail_count += 1
                if agent.delivery_otp_fail_count >= MAX_FAILED_PER_AGENT:
                    agent.delivery_otp_locked_until = datetime.now(UTC) + timedelta(minutes=AGENT_LOCK_MINUTES)
                    await self._audit.log(
                        action=AuditAction.delivery_otp_agent_locked,
                        actor_user_id=agent_user_id,
                        resource_type="user",
                        resource_id=str(agent_user_id),
                        metadata={"locked_until": agent.delivery_otp_locked_until.isoformat()},
                    )
            if row.failed_attempts >= MAX_FAILED_PER_ORDER:
                row.status = DeliveryOtpStatus.locked
            await self._otps.save(row)
            await self._audit.log(
                action=AuditAction.delivery_otp_failed,
                actor_user_id=agent_user_id,
                resource_type="order",
                resource_id=str(order_id),
                metadata={
                    "failed_attempts": row.failed_attempts,
                    "agent_fail_count": agent.delivery_otp_fail_count if agent else None,
                },
            )
            if agent and agent.delivery_otp_locked_until and agent.delivery_otp_locked_until > datetime.now(UTC):
                raise AuthenticationError("Account temporarily locked due to excessive failed OTP attempts")
            raise ValidationError("Invalid delivery OTP")

        now = datetime.now(UTC)
        row.status = DeliveryOtpStatus.verified
        row.verified_at = now
        row.delivery_agent_user_id = agent_user_id
        row.code_ciphertext = None
        if latitude is not None:
            row.verification_latitude = Decimal(str(latitude))
        if longitude is not None:
            row.verification_longitude = Decimal(str(longitude))
        await self._otps.save(row)

        agent = await self._users.get_by_id(agent_user_id)
        if agent:
            agent.delivery_otp_fail_count = 0
            agent.delivery_otp_locked_until = None

        order.status = OrderStatus.delivered
        event = OrderStatusEvent(order_id=order.id, status=OrderStatus.delivered, note=DELIVERY_OTP_VERIFIED_NOTE)
        await self._orders.add_event(event)
        await publish_order_status_update(order, event)
        from app.models.enums import TaskAssignmentType
        from app.services.operations_service import OperationsService
        await OperationsService(self._session).complete_assignment_for_order(order.id, TaskAssignmentType.delivery)

        verify_meta = {
            "latitude": float(latitude) if latitude is not None else None,
            "longitude": float(longitude) if longitude is not None else None,
            "verified_at": now.isoformat(),
        }
        custody = CustodyEventService(self._session)
        await custody.record(
            order.id,
            CustodyEventType.otp_verified,
            actor_user_id=agent_user_id,
            actor_role=CustodyActorRole.partner,
            metadata=verify_meta,
        )
        await custody.record(
            order.id,
            CustodyEventType.delivered,
            actor_user_id=agent_user_id,
            actor_role=CustodyActorRole.partner,
            metadata=verify_meta,
        )

        await TrustScoreService(self._session).on_successful_order(order.user_id, order.id)
        await LaundryTrustScoreService(self._session).recalculate(order.laundry_id)
        await FraudDetectionService(self._session).on_delivery_completed(order.id, order.laundry_id)

        from app.services.settlement_service import SettlementService
        await SettlementService(self._session).on_order_delivered(order)

        await self._audit.log(
            action=AuditAction.delivery_otp_verified,
            actor_user_id=agent_user_id,
            resource_type="order",
            resource_id=str(order_id),
            metadata={
                "latitude": float(latitude) if latitude is not None else None,
                "longitude": float(longitude) if longitude is not None else None,
                "verified_at": now.isoformat(),
            },
        )

        return DeliveryVerifyCompleteResponse(
            order_id=order.id,
            status=order.status.value,
            verified_at=now,
            delivery_agent_user_id=agent_user_id,
        )

    async def is_verified(self, order_id: UUID) -> bool:
        row = await self._otps.get_by_order(order_id)
        return row is not None and row.status == DeliveryOtpStatus.verified

    async def _ensure_agent_not_locked(self, user_id: UUID) -> None:
        user = await self._users.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        if user.delivery_otp_locked_until and user.delivery_otp_locked_until > datetime.now(UTC):
            raise AuthenticationError("Account temporarily locked due to excessive failed OTP attempts")
        if user.delivery_otp_locked_until and user.delivery_otp_locked_until <= datetime.now(UTC):
            user.delivery_otp_locked_until = None
            user.delivery_otp_fail_count = 0

    async def _require_agent_order(self, agent_user_id: UUID, order_id: UUID):
        laundry = await self._laundries.get_by_owner(agent_user_id)
        if not laundry:
            raise NotFoundError("Partner laundry not found")
        order = await self._orders.get_by_id(order_id)
        if not order or order.laundry_id != laundry.id:
            raise NotFoundError("Order not found")
        return order, laundry

    def _refresh_expiry(self, row: OrderDeliveryOtp) -> None:
        if row.status != DeliveryOtpStatus.active:
            return
        if row.expires_at <= datetime.now(UTC):
            row.status = DeliveryOtpStatus.expired
            row.code_ciphertext = None
