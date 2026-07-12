"""Fraud detection rules, risk scoring, and alert generation."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.core.geo import is_far_from_address
from app.models.delivery_otp import OrderDeliveryOtp
from app.models.enums import (
    FraudAlertStatus,
    FraudRiskLevel,
    FraudSignalType,
    FraudSubjectType,
    OrderStatus,
)
from app.models.fraud_alert import FraudAlert
from app.models.order import Order
from app.repositories.fraud_detection import FraudDetectionRepository
from app.schemas.fraud_detection import (
    FRAUD_RISK_LABELS,
    FRAUD_SIGNAL_LABELS,
    FraudAlertResponse,
    FraudEvaluationResult,
    FraudRiskSummary,
    FraudSignalResult,
)

LOOKBACK_DAYS = 30
ALERT_DEDUP_DAYS = 7

SEVERITY_TO_RISK: dict[int, FraudRiskLevel] = {
    0: FraudRiskLevel.low,
    1: FraudRiskLevel.medium,
    2: FraudRiskLevel.high,
    3: FraudRiskLevel.critical,
}


class FraudDetectionService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = FraudDetectionRepository(session)

    @staticmethod
    def _max_risk(signals: list[FraudSignalResult]) -> FraudRiskLevel:
        if not signals:
            return FraudRiskLevel.low
        max_severity = max(s.severity for s in signals)
        return SEVERITY_TO_RISK.get(max_severity, FraudRiskLevel.low)

    async def evaluate_customer(self, user_id: UUID) -> FraudEvaluationResult:
        user = await self._repo.get_user(user_id)
        if not user:
            raise NotFoundError("Customer not found")

        since = datetime.now(UTC) - timedelta(days=LOOKBACK_DAYS)
        signals: list[FraudSignalResult] = []

        disputes = await self._repo.count_customer_disputes_since(user_id, since)
        if disputes > 3:
            severity = 1 if disputes <= 5 else (2 if disputes <= 6 else 3)
            signals.append(
                FraudSignalResult(
                    signal_type=FraudSignalType.customer_dispute_spike,
                    label=FRAUD_SIGNAL_LABELS[FraudSignalType.customer_dispute_spike],
                    severity=severity,
                    risk_level=SEVERITY_TO_RISK[severity],
                    detail=f"{disputes} disputes in the last {LOOKBACK_DAYS} days (threshold: >3)",
                    metadata={"disputes_30d": disputes},
                ),
            )

        completed = await self._repo.count_customer_completed_orders(user_id)
        refunded = await self._repo.count_customer_refunded_orders(user_id)
        if completed > 0:
            refund_rate = refunded / completed
            if refund_rate > 0.40:
                severity = 3
            elif refund_rate > 0.25:
                severity = 2
            elif refund_rate > 0.15:
                severity = 1
            else:
                severity = 0
            if severity > 0:
                signals.append(
                    FraudSignalResult(
                        signal_type=FraudSignalType.customer_refund_rate,
                        label=FRAUD_SIGNAL_LABELS[FraudSignalType.customer_refund_rate],
                        severity=severity,
                        risk_level=SEVERITY_TO_RISK[severity],
                        detail=f"Refund rate {refund_rate:.0%} ({refunded}/{completed} orders)",
                        metadata={"refund_rate": round(refund_rate, 3), "refunded": refunded, "completed": completed},
                    ),
                )

        payment_failures = await self._repo.count_customer_payment_failures_since(user_id, since)
        if payment_failures >= 3:
            severity = 1 if payment_failures < 5 else 2
            signals.append(
                FraudSignalResult(
                    signal_type=FraudSignalType.customer_payment_failures,
                    label=FRAUD_SIGNAL_LABELS[FraudSignalType.customer_payment_failures],
                    severity=severity,
                    risk_level=SEVERITY_TO_RISK[severity],
                    detail=f"{payment_failures} payment failures in {LOOKBACK_DAYS} days",
                    metadata={"payment_failures_30d": payment_failures},
                ),
            )

        cancellations = await self._repo.count_customer_cancellations_since(user_id, since)
        if cancellations >= 3:
            severity = 1 if cancellations < 5 else 2
            signals.append(
                FraudSignalResult(
                    signal_type=FraudSignalType.customer_cancellations,
                    label=FRAUD_SIGNAL_LABELS[FraudSignalType.customer_cancellations],
                    severity=severity,
                    risk_level=SEVERITY_TO_RISK[severity],
                    detail=f"{cancellations} cancelled orders in {LOOKBACK_DAYS} days",
                    metadata={"cancellations_30d": cancellations},
                ),
            )

        risk = self._max_risk(signals)
        user.fraud_risk_level = risk
        alerts_created = await self._emit_alerts(
            FraudSubjectType.customer,
            user_id,
            user.full_name,
            signals,
        )
        await self._session.flush()

        return FraudEvaluationResult(
            subject_type=FraudSubjectType.customer,
            subject_id=user_id,
            subject_name=user.full_name,
            risk_level=risk,
            risk_label=FRAUD_RISK_LABELS[risk],
            signals=signals,
            alerts_created=alerts_created,
            evaluated_at=datetime.now(UTC),
        )

    async def evaluate_partner(self, laundry_id: UUID) -> FraudEvaluationResult:
        laundry = await self._repo.get_laundry(laundry_id)
        if not laundry:
            raise NotFoundError("Laundry not found")

        since = datetime.now(UTC) - timedelta(days=LOOKBACK_DAYS)
        signals: list[FraudSignalResult] = []

        complaints = await self._repo.count_partner_complaints_since(laundry_id, since)
        completed = await self._repo.count_partner_completed_since(laundry_id, since)
        complaint_rate = (complaints / completed) if completed > 0 else 0.0

        if complaints >= 5 or complaint_rate > 0.10:
            if complaint_rate > 0.10 or complaints >= 15:
                severity = 3
            elif complaints >= 10:
                severity = 2
            else:
                severity = 1
            signals.append(
                FraudSignalResult(
                    signal_type=FraudSignalType.partner_excessive_complaints,
                    label=FRAUD_SIGNAL_LABELS[FraudSignalType.partner_excessive_complaints],
                    severity=severity,
                    risk_level=SEVERITY_TO_RISK[severity],
                    detail=f"{complaints} complaints in {LOOKBACK_DAYS} days ({complaint_rate:.0%} of completed)",
                    metadata={
                        "complaints_30d": complaints,
                        "complaint_rate": round(complaint_rate, 3),
                        "completed_30d": completed,
                    },
                ),
            )

        mismatches = await self._repo.count_partner_inventory_mismatches_since(laundry_id, since)
        if mismatches >= 2:
            severity = 1 if mismatches < 5 else 2
            signals.append(
                FraudSignalResult(
                    signal_type=FraudSignalType.partner_inventory_mismatch,
                    label=FRAUD_SIGNAL_LABELS[FraudSignalType.partner_inventory_mismatch],
                    severity=severity,
                    risk_level=SEVERITY_TO_RISK[severity],
                    detail=f"{mismatches} inventory mismatches in {LOOKBACK_DAYS} days",
                    metadata={"mismatches_30d": mismatches},
                ),
            )

        delivery_fraud = await self._count_delivery_fraud_incidents(laundry_id, since)
        if delivery_fraud >= 1:
            severity = 2 if delivery_fraud < 3 else 3
            signals.append(
                FraudSignalResult(
                    signal_type=FraudSignalType.partner_delivery_fraud,
                    label=FRAUD_SIGNAL_LABELS[FraudSignalType.partner_delivery_fraud],
                    severity=severity,
                    risk_level=SEVERITY_TO_RISK[severity],
                    detail=f"{delivery_fraud} suspicious deliveries in {LOOKBACK_DAYS} days",
                    metadata={"delivery_fraud_30d": delivery_fraud},
                ),
            )

        risk = self._max_risk(signals)
        laundry.fraud_risk_level = risk
        alerts_created = await self._emit_alerts(
            FraudSubjectType.partner,
            laundry_id,
            laundry.name,
            signals,
        )
        await self._session.flush()

        return FraudEvaluationResult(
            subject_type=FraudSubjectType.partner,
            subject_id=laundry_id,
            subject_name=laundry.name,
            risk_level=risk,
            risk_label=FRAUD_RISK_LABELS[risk],
            signals=signals,
            alerts_created=alerts_created,
            evaluated_at=datetime.now(UTC),
        )

    async def check_delivery_fraud(self, order_id: UUID, laundry_id: UUID) -> FraudSignalResult | None:
        addr_lat, addr_lng = await self._repo.get_order_address_coords(order_id)
        otp_lat, otp_lng = await self._repo.get_delivery_verification_coords(order_id)
        proof_lat, proof_lng = await self._repo.get_delivery_proof_coords(order_id)

        issues: list[str] = []
        if is_far_from_address(addr_lat, addr_lng, otp_lat, otp_lng):
            issues.append("OTP verification GPS far from delivery address")
        if is_far_from_address(addr_lat, addr_lng, proof_lat, proof_lng):
            issues.append("Delivery proof GPS far from delivery address")
        if addr_lat is not None and otp_lat is None:
            issues.append("Missing GPS on OTP verification")

        if not issues:
            return None

        return FraudSignalResult(
            signal_type=FraudSignalType.partner_delivery_fraud,
            label=FRAUD_SIGNAL_LABELS[FraudSignalType.partner_delivery_fraud],
            severity=2,
            risk_level=FraudRiskLevel.high,
            detail="; ".join(issues),
            metadata={
                "order_id": str(order_id),
                "address_lat": addr_lat,
                "address_lng": addr_lng,
                "otp_lat": otp_lat,
                "otp_lng": otp_lng,
                "proof_lat": proof_lat,
                "proof_lng": proof_lng,
            },
        )

    async def on_dispute_filed(self, user_id: UUID, order_id: UUID) -> None:
        await self.evaluate_customer(user_id)
        from app.repositories.order import OrderRepository

        order = await OrderRepository(self._session).get_by_id(order_id)
        if order:
            await self.evaluate_partner(order.laundry_id)

    async def on_payment_failed(self, user_id: UUID) -> None:
        await self.evaluate_customer(user_id)

    async def on_order_cancelled(self, user_id: UUID) -> None:
        await self.evaluate_customer(user_id)

    async def on_delivery_completed(self, order_id: UUID, laundry_id: UUID) -> None:
        signal = await self.check_delivery_fraud(order_id, laundry_id)
        laundry = await self._repo.get_laundry(laundry_id)
        if signal and laundry:
            await self._emit_alerts(FraudSubjectType.partner, laundry_id, laundry.name, [signal])
            await self.evaluate_partner(laundry_id)
        else:
            await self.evaluate_partner(laundry_id)

    async def on_inventory_mismatch(self, laundry_id: UUID, order_id: UUID) -> None:
        laundry = await self._repo.get_laundry(laundry_id)
        if not laundry:
            return
        since = datetime.now(UTC) - timedelta(days=LOOKBACK_DAYS)
        mismatches = await self._repo.count_partner_inventory_mismatches_since(laundry_id, since)
        if mismatches >= 2:
            signal = FraudSignalResult(
                signal_type=FraudSignalType.partner_inventory_mismatch,
                label=FRAUD_SIGNAL_LABELS[FraudSignalType.partner_inventory_mismatch],
                severity=1 if mismatches < 5 else 2,
                risk_level=SEVERITY_TO_RISK[1 if mismatches < 5 else 2],
                detail=f"Inventory mismatch recorded for order (total {mismatches} in window)",
                metadata={"order_id": str(order_id), "mismatches_30d": mismatches},
            )
            await self._emit_alerts(FraudSubjectType.partner, laundry_id, laundry.name, [signal])
        await self.evaluate_partner(laundry_id)

    async def list_alerts_admin(
        self,
        *,
        status: FraudAlertStatus | None = None,
        risk_level: str | None = None,
        subject_type: FraudSubjectType | None = None,
    ) -> list[FraudAlertResponse]:
        rows = await self._repo.list_alerts(
            status=status,
            risk_level=risk_level,
            subject_type=subject_type,
        )
        return [await self._alert_response(r) for r in rows]

    async def get_alert_admin(self, alert_id: UUID) -> FraudAlertResponse:
        row = await self._repo.get_alert(alert_id)
        if not row:
            raise NotFoundError("Alert not found")
        return await self._alert_response(row)

    async def acknowledge_alert(self, admin_user_id: UUID, alert_id: UUID) -> FraudAlertResponse:
        row = await self._repo.get_alert(alert_id)
        if not row:
            raise NotFoundError("Alert not found")
        row.status = FraudAlertStatus.acknowledged
        row.acknowledged_by_user_id = admin_user_id
        row.acknowledged_at = datetime.now(UTC)
        await self._session.flush()
        return await self._alert_response(row)

    async def resolve_alert(self, admin_user_id: UUID, alert_id: UUID) -> FraudAlertResponse:
        row = await self._repo.get_alert(alert_id)
        if not row:
            raise NotFoundError("Alert not found")
        row.status = FraudAlertStatus.resolved
        row.resolved_by_user_id = admin_user_id
        row.resolved_at = datetime.now(UTC)
        await self._session.flush()
        return await self._alert_response(row)

    async def risk_summary(self) -> FraudRiskSummary:
        counts = await self._repo.count_open_by_risk()
        for level in ("low", "medium", "high", "critical"):
            counts.setdefault(level, 0)
        return FraudRiskSummary(
            open_by_risk=counts,
            total_open=sum(counts.values()),
        )

    async def _count_delivery_fraud_incidents(self, laundry_id: UUID, since: datetime) -> int:
        rows = await self._session.execute(
            select(Order.id)
            .join(OrderDeliveryOtp, OrderDeliveryOtp.order_id == Order.id)
            .where(
                Order.laundry_id == laundry_id,
                Order.status == OrderStatus.delivered,
                OrderDeliveryOtp.verified_at.isnot(None),
                OrderDeliveryOtp.verified_at >= since,
            ),
        )
        count = 0
        for (order_id,) in rows.all():
            signal = await self.check_delivery_fraud(order_id, laundry_id)
            if signal:
                count += 1
        return count

    async def _emit_alerts(
        self,
        subject_type: FraudSubjectType,
        subject_id: UUID,
        subject_name: str,
        signals: list[FraudSignalResult],
    ) -> int:
        dedup_since = datetime.now(UTC) - timedelta(days=ALERT_DEDUP_DAYS)
        created = 0
        for signal in signals:
            if signal.severity < 1:
                continue
            if await self._repo.has_open_alert(
                subject_type=subject_type,
                subject_id=subject_id,
                signal_type=signal.signal_type,
                since=dedup_since,
            ):
                continue
            alert = FraudAlert(
                subject_type=subject_type,
                subject_id=subject_id,
                signal_type=signal.signal_type,
                risk_level=signal.risk_level,
                title=self._alert_title(subject_type, subject_name, signal),
                description=signal.detail,
                status=FraudAlertStatus.open,
                metadata_=signal.metadata,
            )
            await self._repo.save_alert(alert)
            created += 1
        return created

    @staticmethod
    def _alert_title(
        subject_type: FraudSubjectType,
        subject_name: str,
        signal: FraudSignalResult,
    ) -> str:
        prefix = "Customer" if subject_type == FraudSubjectType.customer else "Partner"
        return f"{prefix} risk: {subject_name} — {signal.label}"

    async def _alert_response(self, row: FraudAlert) -> FraudAlertResponse:
        subject_name: str | None = None
        if row.subject_type == FraudSubjectType.customer:
            user = await self._repo.get_user(row.subject_id)
            subject_name = user.full_name if user else None
        else:
            laundry = await self._repo.get_laundry(row.subject_id)
            subject_name = laundry.name if laundry else None

        return FraudAlertResponse(
            id=row.id,
            subject_type=row.subject_type,
            subject_id=row.subject_id,
            subject_name=subject_name,
            signal_type=row.signal_type,
            signal_label=FRAUD_SIGNAL_LABELS.get(row.signal_type, row.signal_type.value),
            risk_level=row.risk_level,
            risk_label=FRAUD_RISK_LABELS[row.risk_level],
            title=row.title,
            description=row.description,
            status=row.status,
            reference_type=row.reference_type,
            reference_id=row.reference_id,
            metadata=row.metadata_,
            created_at=row.created_at,
            acknowledged_at=row.acknowledged_at,
            resolved_at=row.resolved_at,
        )
