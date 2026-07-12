"""Fraud risk snapshot for admin dispute review."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.complaint import Complaint
from app.models.enums import FraudRiskLevel
from app.repositories.fraud_detection import FraudDetectionRepository
from app.repositories.laundry import LaundryRepository
from app.repositories.order import OrderRepository
from app.repositories.user import UserRepository
from app.schemas.fraud_detection import FRAUD_RISK_LABELS

LOOKBACK_DAYS = 30

_RISK_RANK: dict[FraudRiskLevel, int] = {
    FraudRiskLevel.low: 0,
    FraudRiskLevel.medium: 1,
    FraudRiskLevel.high: 2,
    FraudRiskLevel.critical: 3,
}

_RISK_LABELS: dict[FraudRiskLevel, str] = {
    FraudRiskLevel.low: "Low Risk",
    FraudRiskLevel.medium: "Medium Risk",
    FraudRiskLevel.high: "High Risk",
    FraudRiskLevel.critical: "Critical Risk",
}


def _risk_score_from_trust(trust_score: int) -> int:
    return max(0, min(100, 100 - trust_score))


def _pct(numerator: int, denominator: int) -> str:
    if denominator <= 0:
        return "0%"
    return f"{(numerator / denominator) * 100:.1f}%"


def _max_risk(*levels: FraudRiskLevel) -> FraudRiskLevel:
    return max(levels, key=lambda level: _RISK_RANK[level])


class DisputeFraudRiskService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._fraud = FraudDetectionRepository(session)
        self._users = UserRepository(session)
        self._orders = OrderRepository(session)
        self._laundries = LaundryRepository(session)

    async def build_for_complaint(self, complaint: Complaint) -> dict:
        since = datetime.now(UTC) - timedelta(days=LOOKBACK_DAYS)
        customer = await self._users.get_by_id(complaint.user_id)
        if not customer:
            raise ValueError("Customer not found")

        disputes_30d = await self._fraud.count_customer_disputes_since(complaint.user_id, since)
        disputes_total = await self._fraud.count_customer_disputes_total(complaint.user_id)
        previous_claims = max(0, disputes_total - 1)
        orders_30d = await self._fraud.count_customer_orders_since(complaint.user_id, since)
        completed = await self._fraud.count_customer_completed_orders(complaint.user_id)
        refunded = await self._fraud.count_customer_refunded_orders(complaint.user_id)

        customer_profile = {
            "risk_score": _risk_score_from_trust(customer.trust_score),
            "risk_level": customer.fraud_risk_level,
            "risk_label": _RISK_LABELS.get(customer.fraud_risk_level, FRAUD_RISK_LABELS[customer.fraud_risk_level]),
            "trust_score": customer.trust_score,
            "dispute_frequency_30d": disputes_30d,
            "dispute_frequency_pct": _pct(disputes_30d, orders_30d),
            "refund_rate_pct": _pct(refunded, completed),
            "previous_claims": previous_claims,
            "previous_complaints": disputes_total,
        }

        partner_profile = None
        overall = customer.fraud_risk_level

        if complaint.order_id:
            order = await self._orders.get_by_id(complaint.order_id)
            if order:
                laundry = await self._laundries.get_by_id(order.laundry_id)
                if laundry:
                    complaints_30d = await self._fraud.count_partner_complaints_since(laundry.id, since)
                    complaints_total = await self._fraud.count_partner_complaints_total(laundry.id)
                    completed_30d = await self._fraud.count_partner_completed_since(laundry.id, since)
                    partner_profile = {
                        "risk_score": _risk_score_from_trust(laundry.trust_score),
                        "risk_level": laundry.fraud_risk_level,
                        "risk_label": _RISK_LABELS.get(
                            laundry.fraud_risk_level,
                            FRAUD_RISK_LABELS[laundry.fraud_risk_level],
                        ),
                        "trust_score": laundry.trust_score,
                        "dispute_frequency_30d": complaints_30d,
                        "dispute_frequency_pct": _pct(complaints_30d, completed_30d),
                        "refund_rate_pct": _pct(
                            await self._fraud.count_partner_refunded_orders(laundry.id),
                            await self._fraud.count_partner_completed_orders(laundry.id),
                        ),
                        "previous_claims": max(0, complaints_total - 1),
                        "previous_complaints": complaints_total,
                    }
                    overall = _max_risk(overall, laundry.fraud_risk_level)

        return {
            "overall_risk_level": overall,
            "overall_risk_label": _RISK_LABELS.get(overall, FRAUD_RISK_LABELS[overall]),
            "customer": customer_profile,
            "partner": partner_profile,
        }
