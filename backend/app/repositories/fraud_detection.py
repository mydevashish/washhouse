"""Fraud detection metric queries."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.complaint import Complaint
from app.models.delivery_otp import OrderDeliveryOtp
from app.models.delivery_proof import DeliveryProofPhoto
from app.models.enums import (
    FraudAlertStatus,
    FraudSignalType,
    FraudSubjectType,
    OrderStatus,
    PaymentStatus,
    TrustScoreEventType,
)
from app.models.fraud_alert import FraudAlert
from app.models.laundry import Laundry
from app.models.order import Order, OrderInventory
from app.models.trust_score import CustomerTrustScoreEvent
from app.models.user import User
from app.models.user_address import UserAddress


class FraudDetectionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_user(self, user_id: UUID) -> User | None:
        result = await self._session.execute(
            select(User).where(User.id == user_id, User.deleted_at.is_(None)),
        )
        return result.scalar_one_or_none()

    async def get_laundry(self, laundry_id: UUID) -> Laundry | None:
        result = await self._session.execute(
            select(Laundry).where(Laundry.id == laundry_id, Laundry.deleted_at.is_(None)),
        )
        return result.scalar_one_or_none()

    async def count_customer_disputes_since(self, user_id: UUID, since: datetime) -> int:
        result = await self._session.execute(
            select(func.count())
            .select_from(Complaint)
            .where(Complaint.user_id == user_id, Complaint.created_at >= since),
        )
        return int(result.scalar_one())

    async def count_customer_orders_since(self, user_id: UUID, since: datetime) -> int:
        result = await self._session.execute(
            select(func.count())
            .select_from(Order)
            .where(
                Order.user_id == user_id,
                Order.created_at >= since,
                Order.deleted_at.is_(None),
            ),
        )
        return int(result.scalar_one())

    async def count_customer_refunded_orders(self, user_id: UUID) -> int:
        result = await self._session.execute(
            select(func.count())
            .select_from(Order)
            .where(
                Order.user_id == user_id,
                Order.payment_status == PaymentStatus.refunded,
                Order.deleted_at.is_(None),
            ),
        )
        return int(result.scalar_one())

    async def count_customer_completed_orders(self, user_id: UUID) -> int:
        result = await self._session.execute(
            select(func.count())
            .select_from(Order)
            .where(
                Order.user_id == user_id,
                Order.status == OrderStatus.delivered,
                Order.deleted_at.is_(None),
            ),
        )
        return int(result.scalar_one())

    async def count_customer_payment_failures_since(self, user_id: UUID, since: datetime) -> int:
        result = await self._session.execute(
            select(func.count())
            .select_from(CustomerTrustScoreEvent)
            .where(
                CustomerTrustScoreEvent.user_id == user_id,
                CustomerTrustScoreEvent.event_type == TrustScoreEventType.failed_payment,
                CustomerTrustScoreEvent.created_at >= since,
            ),
        )
        trust_events = int(result.scalar_one())
        result2 = await self._session.execute(
            select(func.count())
            .select_from(Order)
            .where(
                Order.user_id == user_id,
                Order.payment_status == PaymentStatus.failed,
                Order.updated_at >= since,
                Order.deleted_at.is_(None),
            ),
        )
        failed_orders = int(result2.scalar_one())
        return max(trust_events, failed_orders)

    async def count_customer_cancellations_since(self, user_id: UUID, since: datetime) -> int:
        result = await self._session.execute(
            select(func.count())
            .select_from(Order)
            .where(
                Order.user_id == user_id,
                Order.status == OrderStatus.cancelled,
                Order.updated_at >= since,
                Order.deleted_at.is_(None),
            ),
        )
        return int(result.scalar_one())

    async def count_customer_disputes_total(self, user_id: UUID) -> int:
        result = await self._session.execute(
            select(func.count()).select_from(Complaint).where(Complaint.user_id == user_id),
        )
        return int(result.scalar_one())

    async def count_partner_complaints_total(self, laundry_id: UUID) -> int:
        result = await self._session.execute(
            select(func.count())
            .select_from(Complaint)
            .join(Order, Complaint.order_id == Order.id)
            .where(Order.laundry_id == laundry_id),
        )
        return int(result.scalar_one())

    async def count_partner_completed_orders(self, laundry_id: UUID) -> int:
        result = await self._session.execute(
            select(func.count())
            .select_from(Order)
            .where(
                Order.laundry_id == laundry_id,
                Order.status == OrderStatus.delivered,
                Order.deleted_at.is_(None),
            ),
        )
        return int(result.scalar_one())

    async def count_partner_refunded_orders(self, laundry_id: UUID) -> int:
        result = await self._session.execute(
            select(func.count())
            .select_from(Order)
            .where(
                Order.laundry_id == laundry_id,
                Order.payment_status == PaymentStatus.refunded,
                Order.deleted_at.is_(None),
            ),
        )
        return int(result.scalar_one())

    async def count_partner_complaints_since(self, laundry_id: UUID, since: datetime) -> int:
        result = await self._session.execute(
            select(func.count())
            .select_from(Complaint)
            .join(Order, Complaint.order_id == Order.id)
            .where(Order.laundry_id == laundry_id, Complaint.created_at >= since),
        )
        return int(result.scalar_one())

    async def count_partner_completed_since(self, laundry_id: UUID, since: datetime) -> int:
        result = await self._session.execute(
            select(func.count())
            .select_from(Order)
            .where(
                Order.laundry_id == laundry_id,
                Order.status == OrderStatus.delivered,
                Order.updated_at >= since,
                Order.deleted_at.is_(None),
            ),
        )
        return int(result.scalar_one())

    async def count_partner_inventory_mismatches_since(self, laundry_id: UUID, since: datetime) -> int:
        result = await self._session.execute(
            select(func.count())
            .select_from(OrderInventory)
            .join(Order, OrderInventory.order_id == Order.id)
            .where(
                Order.laundry_id == laundry_id,
                OrderInventory.created_at >= since,
                or_(
                    OrderInventory.received_count < OrderInventory.expected_count,
                    OrderInventory.missing_notes.isnot(None),
                    OrderInventory.damaged_notes.isnot(None),
                ),
            ),
        )
        return int(result.scalar_one())

    async def get_order_address_coords(self, order_id: UUID) -> tuple[float | None, float | None]:
        result = await self._session.execute(
            select(UserAddress.latitude, UserAddress.longitude)
            .join(Order, Order.address_id == UserAddress.id)
            .where(Order.id == order_id),
        )
        row = result.one_or_none()
        if not row:
            return None, None
        lat, lng = row
        return (float(lat) if lat is not None else None, float(lng) if lng is not None else None)

    async def get_delivery_verification_coords(self, order_id: UUID) -> tuple[float | None, float | None]:
        result = await self._session.execute(
            select(OrderDeliveryOtp.verification_latitude, OrderDeliveryOtp.verification_longitude).where(
                OrderDeliveryOtp.order_id == order_id,
            ),
        )
        row = result.one_or_none()
        if not row:
            return None, None
        lat, lng = row
        return (float(lat) if lat is not None else None, float(lng) if lng is not None else None)

    async def get_delivery_proof_coords(self, order_id: UUID) -> tuple[float | None, float | None]:
        result = await self._session.execute(
            select(DeliveryProofPhoto.latitude, DeliveryProofPhoto.longitude).where(
                DeliveryProofPhoto.order_id == order_id,
            ),
        )
        row = result.one_or_none()
        if not row:
            return None, None
        lat, lng = row
        return (float(lat) if lat is not None else None, float(lng) if lng is not None else None)

    async def has_open_alert(
        self,
        *,
        subject_type: FraudSubjectType,
        subject_id: UUID,
        signal_type: FraudSignalType,
        since: datetime,
    ) -> bool:
        result = await self._session.execute(
            select(func.count())
            .select_from(FraudAlert)
            .where(
                FraudAlert.subject_type == subject_type,
                FraudAlert.subject_id == subject_id,
                FraudAlert.signal_type == signal_type,
                FraudAlert.status.in_([FraudAlertStatus.open, FraudAlertStatus.acknowledged]),
                FraudAlert.created_at >= since,
            ),
        )
        return int(result.scalar_one()) > 0

    async def save_alert(self, alert: FraudAlert) -> FraudAlert:
        self._session.add(alert)
        await self._session.flush()
        return alert

    async def get_alert(self, alert_id: UUID) -> FraudAlert | None:
        result = await self._session.execute(select(FraudAlert).where(FraudAlert.id == alert_id))
        return result.scalar_one_or_none()

    async def list_alerts(
        self,
        *,
        status: FraudAlertStatus | None = None,
        risk_level: str | None = None,
        subject_type: FraudSubjectType | None = None,
        limit: int = 200,
    ) -> list[FraudAlert]:
        q = select(FraudAlert).order_by(FraudAlert.created_at.desc()).limit(limit)
        if status is not None:
            q = q.where(FraudAlert.status == status)
        if risk_level is not None:
            q = q.where(FraudAlert.risk_level == risk_level)
        if subject_type is not None:
            q = q.where(FraudAlert.subject_type == subject_type)
        result = await self._session.execute(q)
        return list(result.scalars().all())

    async def count_open_by_risk(self) -> dict[str, int]:
        result = await self._session.execute(
            select(FraudAlert.risk_level, func.count())
            .where(FraudAlert.status.in_([FraudAlertStatus.open, FraudAlertStatus.acknowledged]))
            .group_by(FraudAlert.risk_level),
        )
        return {str(row[0].value): int(row[1]) for row in result.all()}
