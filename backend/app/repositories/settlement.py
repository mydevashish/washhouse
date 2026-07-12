"""Settlement persistence and queries."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import and_, cast, func, or_, select, Date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.complaint import Complaint
from app.models.enums import (
    ComplaintStatus,
    OrderStatus,
    SettlementEligibility,
    SettlementStatus,
)
from app.models.laundry import Laundry
from app.models.order import Order
from app.models.settlement import Settlement, SettlementAdjustment, SettlementOrder
from app.models.user import User
from app.services.settlement_calculator import calc_order_settlement_amounts

_OPEN_COMPLAINT = (
    ComplaintStatus.open,
    ComplaintStatus.investigating,
    ComplaintStatus.awaiting_customer,
    ComplaintStatus.awaiting_partner,
    ComplaintStatus.escalated,
)


class SettlementRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, settlement_id: UUID) -> Settlement | None:
        return await self._session.scalar(
            select(Settlement)
            .options(selectinload(Settlement.line_items), selectinload(Settlement.adjustments))
            .where(Settlement.id == settlement_id),
        )

    async def order_has_open_complaint(self, order_id: UUID) -> bool:
        count = await self._session.scalar(
            select(func.count())
            .select_from(Complaint)
            .where(Complaint.order_id == order_id, Complaint.status.in_(_OPEN_COMPLAINT)),
        )
        return int(count or 0) > 0

    async def list_eligible_orders(self) -> list[Order]:
        now = datetime.now(UTC)
        rows = await self._session.scalars(
            select(Order)
            .where(
                Order.deleted_at.is_(None),
                Order.status == OrderStatus.delivered,
                Order.settlement_eligibility == SettlementEligibility.eligible,
                Order.settlement_id.is_(None),
                Order.settlement_eligible_at.isnot(None),
                Order.settlement_eligible_at <= now,
            )
            .order_by(Order.laundry_id, Order.settlement_eligible_at),
        )
        return list(rows.all())

    async def create_settlement(
        self,
        *,
        laundry_id: UUID,
        partner_user_id: UUID,
        period_start: datetime,
        period_end: datetime,
        orders: list[Order],
    ) -> Settlement:
        code = f"STL-{datetime.now(UTC).strftime('%Y%m%d')}-{uuid4().hex[:8].upper()}"
        gross = Decimal("0")
        commission = Decimal("0")
        refund = Decimal("0")
        net = Decimal("0")

        settlement = Settlement(
            settlement_code=code,
            laundry_id=laundry_id,
            partner_user_id=partner_user_id,
            period_start=period_start,
            period_end=period_end,
            orders_count=len(orders),
            status=SettlementStatus.pending,
        )
        self._session.add(settlement)
        await self._session.flush()

        for order in orders:
            amounts = calc_order_settlement_amounts(order)
            gross += amounts["gross_inr"]
            commission += amounts["commission_inr"]
            refund += amounts["refund_inr"]
            net += amounts["net_inr"]
            self._session.add(
                SettlementOrder(
                    settlement_id=settlement.id,
                    order_id=order.id,
                    gross_inr=amounts["gross_inr"],
                    commission_inr=amounts["commission_inr"],
                    refund_inr=amounts["refund_inr"],
                    net_inr=amounts["net_inr"],
                ),
            )
            order.settlement_id = settlement.id
            order.settlement_eligibility = SettlementEligibility.in_settlement

        settlement.gross_revenue_inr = gross.quantize(Decimal("0.01"))
        settlement.commission_inr = commission.quantize(Decimal("0.01"))
        settlement.refund_inr = refund.quantize(Decimal("0.01"))
        settlement.net_amount_inr = net.quantize(Decimal("0.01"))
        await self._session.flush()
        return settlement

    async def admin_table(
        self,
        *,
        status: SettlementStatus | None = None,
        laundry_id: UUID | None = None,
        partner_id: UUID | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        page: int = 1,
        page_size: int = 25,
        sort_by: str = "created_at",
        sort_dir: str = "desc",
    ) -> tuple[list[dict], int]:
        base = (
            select(
                Settlement,
                Laundry.name,
                User.full_name,
                User.email,
            )
            .join(Laundry, Laundry.id == Settlement.laundry_id)
            .join(User, User.id == Settlement.partner_user_id)
        )
        if status:
            base = base.where(Settlement.status == status)
        if laundry_id:
            base = base.where(Settlement.laundry_id == laundry_id)
        if partner_id:
            base = base.where(Settlement.partner_user_id == partner_id)
        if date_from:
            base = base.where(Settlement.created_at >= date_from)
        if date_to:
            base = base.where(Settlement.created_at <= date_to)

        total = int(await self._session.scalar(select(func.count()).select_from(base.subquery())) or 0)

        sort_map = {
            "created_at": Settlement.created_at,
            "paid_at": Settlement.paid_at,
            "net_amount": Settlement.net_amount_inr,
            "orders_count": Settlement.orders_count,
            "period_start": Settlement.period_start,
        }
        sort_col = sort_map.get(sort_by, Settlement.created_at)
        order_expr = sort_col.desc() if sort_dir == "desc" else sort_col.asc()

        rows = await self._session.execute(
            base.order_by(order_expr).offset((page - 1) * page_size).limit(page_size),
        )
        items = []
        for st, laundry_name, partner_name, partner_email in rows.all():
            items.append(
                {
                    "id": st.id,
                    "settlement_code": st.settlement_code,
                    "laundry_id": st.laundry_id,
                    "laundry_name": laundry_name,
                    "partner_user_id": st.partner_user_id,
                    "partner_name": partner_name,
                    "partner_email": partner_email,
                    "period_start": st.period_start,
                    "period_end": st.period_end,
                    "orders_count": st.orders_count,
                    "gross_revenue_inr": str(st.gross_revenue_inr),
                    "commission_inr": str(st.commission_inr),
                    "refund_inr": str(st.refund_inr),
                    "adjustment_inr": str(st.adjustment_inr),
                    "net_amount_inr": str(st.net_amount_inr),
                    "status": st.status.value,
                    "created_at": st.created_at,
                    "paid_at": st.paid_at,
                    "payout_reference": st.payout_reference,
                },
            )
        return items, total

    async def dashboard_metrics(self) -> dict:
        pending = await self._session.scalar(
            select(func.coalesce(func.sum(Settlement.net_amount_inr), 0)).where(
                Settlement.status.in_(
                    (
                        SettlementStatus.pending,
                        SettlementStatus.approved,
                        SettlementStatus.processing,
                    ),
                ),
            ),
        )
        on_hold_inr = await self._session.scalar(
            select(func.coalesce(func.sum(Settlement.net_amount_inr), 0)).where(
                Settlement.status == SettlementStatus.on_hold,
            ),
        )
        on_hold_count = await self._session.scalar(
            select(func.count()).select_from(Settlement).where(Settlement.status == SettlementStatus.on_hold),
        )
        paid = await self._session.scalar(
            select(func.coalesce(func.sum(Settlement.net_amount_inr), 0)).where(
                Settlement.status == SettlementStatus.paid,
            ),
        )
        today_start = datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0)
        today_payouts = await self._session.scalar(
            select(func.coalesce(func.sum(Settlement.net_amount_inr), 0)).where(
                Settlement.status == SettlementStatus.paid,
                Settlement.paid_at >= today_start,
            ),
        )
        month_start = today_start.replace(day=1)
        monthly_payouts = await self._session.scalar(
            select(func.coalesce(func.sum(Settlement.net_amount_inr), 0)).where(
                Settlement.status == SettlementStatus.paid,
                Settlement.paid_at >= month_start,
            ),
        )
        partner_earnings = await self._session.scalar(
            select(func.coalesce(func.sum(Settlement.net_amount_inr), 0)).where(
                Settlement.status == SettlementStatus.paid,
            ),
        )
        platform_commission = await self._session.scalar(
            select(func.coalesce(func.sum(Settlement.commission_inr), 0)).where(
                Settlement.status == SettlementStatus.paid,
            ),
        )
        pending_count = await self._session.scalar(
            select(func.count()).select_from(Settlement).where(Settlement.status == SettlementStatus.pending),
        )
        paid_count = await self._session.scalar(
            select(func.count()).select_from(Settlement).where(Settlement.status == SettlementStatus.paid),
        )
        return {
            "total_pending_settlements_inr": str(Decimal(str(pending or 0)).quantize(Decimal("0.01"))),
            "total_paid_settlements_inr": str(Decimal(str(paid or 0)).quantize(Decimal("0.01"))),
            "today_payouts_inr": str(Decimal(str(today_payouts or 0)).quantize(Decimal("0.01"))),
            "monthly_payouts_inr": str(Decimal(str(monthly_payouts or 0)).quantize(Decimal("0.01"))),
            "partner_earnings_inr": str(Decimal(str(partner_earnings or 0)).quantize(Decimal("0.01"))),
            "platform_commission_inr": str(Decimal(str(platform_commission or 0)).quantize(Decimal("0.01"))),
            "pending_count": int(pending_count or 0),
            "paid_count": int(paid_count or 0),
            "on_hold_count": int(on_hold_count or 0),
            "on_hold_inr": str(Decimal(str(on_hold_inr or 0)).quantize(Decimal("0.01"))),
        }

    async def analytics(self) -> dict:
        status_rows = await self._session.execute(
            select(
                Settlement.status,
                func.count(),
                func.coalesce(func.sum(Settlement.net_amount_inr), 0),
            ).group_by(Settlement.status),
        )
        status_breakdown = []
        for st, count, total in status_rows.all():
            status_breakdown.append(
                {
                    "status": st.value if hasattr(st, "value") else str(st),
                    "count": int(count),
                    "total_inr": str(Decimal(str(total or 0)).quantize(Decimal("0.01"))),
                },
            )

        month_start = datetime.now(UTC).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        six_months_ago = (month_start.replace(day=1) - timedelta(days=180)).replace(day=1)

        monthly_rows = await self._session.execute(
            select(
                func.to_char(Settlement.paid_at, "YYYY-MM"),
                func.coalesce(func.sum(Settlement.net_amount_inr), 0),
                func.coalesce(func.sum(Settlement.commission_inr), 0),
                func.count(),
            )
            .where(
                Settlement.status == SettlementStatus.paid,
                Settlement.paid_at.isnot(None),
                Settlement.paid_at >= six_months_ago,
            )
            .group_by(func.to_char(Settlement.paid_at, "YYYY-MM"))
            .order_by(func.to_char(Settlement.paid_at, "YYYY-MM")),
        )
        monthly_payouts = [
            {
                "month": month,
                "payout_inr": str(Decimal(str(payout or 0)).quantize(Decimal("0.01"))),
                "commission_inr": str(Decimal(str(commission or 0)).quantize(Decimal("0.01"))),
                "settlement_count": int(cnt),
            }
            for month, payout, commission, cnt in monthly_rows.all()
        ]

        top_rows = await self._session.execute(
            select(
                Settlement.partner_user_id,
                User.full_name,
                Laundry.name,
                func.coalesce(func.sum(Settlement.net_amount_inr), 0),
                func.count(),
            )
            .join(User, User.id == Settlement.partner_user_id)
            .join(Laundry, Laundry.id == Settlement.laundry_id)
            .where(Settlement.status == SettlementStatus.paid)
            .group_by(Settlement.partner_user_id, User.full_name, Laundry.name)
            .order_by(func.coalesce(func.sum(Settlement.net_amount_inr), 0).desc())
            .limit(10),
        )
        top_partners = [
            {
                "partner_user_id": uid,
                "partner_name": name,
                "laundry_name": laundry_name,
                "paid_inr": str(Decimal(str(paid or 0)).quantize(Decimal("0.01"))),
                "settlement_count": int(cnt),
            }
            for uid, name, laundry_name, paid, cnt in top_rows.all()
        ]

        paid_gross = await self._session.scalar(
            select(func.coalesce(func.sum(Settlement.gross_revenue_inr), 0)).where(
                Settlement.status == SettlementStatus.paid,
            ),
        )
        paid_commission = await self._session.scalar(
            select(func.coalesce(func.sum(Settlement.commission_inr), 0)).where(
                Settlement.status == SettlementStatus.paid,
            ),
        )
        paid_count = await self._session.scalar(
            select(func.count()).select_from(Settlement).where(Settlement.status == SettlementStatus.paid),
        )
        avg_settlement = Decimal("0")
        if paid_count:
            total_net = await self._session.scalar(
                select(func.coalesce(func.sum(Settlement.net_amount_inr), 0)).where(
                    Settlement.status == SettlementStatus.paid,
                ),
            )
            avg_settlement = Decimal(str(total_net or 0)) / int(paid_count)

        return {
            "status_breakdown": status_breakdown,
            "monthly_payouts": monthly_payouts,
            "top_partners": top_partners,
            "total_gross_paid_inr": str(Decimal(str(paid_gross or 0)).quantize(Decimal("0.01"))),
            "total_commission_paid_inr": str(Decimal(str(paid_commission or 0)).quantize(Decimal("0.01"))),
            "avg_settlement_inr": str(avg_settlement.quantize(Decimal("0.01"))),
        }

    async def partner_summary(self, partner_user_id: UUID) -> dict:
        laundry_ids = select(Laundry.id).where(Laundry.owner_user_id == partner_user_id)
        order_rows = await self._session.scalars(
            select(Order).where(
                Order.deleted_at.is_(None),
                Order.settlement_id.is_(None),
                Order.laundry_id.in_(laundry_ids),
                Order.status == OrderStatus.delivered,
            ),
        )
        pending_net = Decimal("0")
        available_net = Decimal("0")
        for order in order_rows.all():
            amounts = calc_order_settlement_amounts(order)
            net = amounts["net_inr"]
            if order.settlement_eligibility in (
                SettlementEligibility.pending_window,
                SettlementEligibility.held_dispute,
            ):
                pending_net += net
            elif order.settlement_eligibility == SettlementEligibility.eligible:
                available_net += net

        approved_available = await self._session.scalar(
            select(func.coalesce(func.sum(Settlement.net_amount_inr), 0)).where(
                Settlement.partner_user_id == partner_user_id,
                Settlement.status == SettlementStatus.approved,
            ),
        )
        in_flight = await self._session.scalar(
            select(func.coalesce(func.sum(Settlement.net_amount_inr), 0)).where(
                Settlement.partner_user_id == partner_user_id,
                Settlement.status.in_(
                    (
                        SettlementStatus.pending,
                        SettlementStatus.approved,
                        SettlementStatus.processing,
                    ),
                ),
            ),
        )
        released = await self._session.scalar(
            select(func.coalesce(func.sum(Settlement.net_amount_inr), 0)).where(
                Settlement.partner_user_id == partner_user_id,
                Settlement.status == SettlementStatus.paid,
            ),
        )
        available_total = available_net + Decimal(str(approved_available or 0))
        return {
            "pending_earnings_inr": str(pending_net.quantize(Decimal("0.01"))),
            "available_earnings_inr": str(available_total.quantize(Decimal("0.01"))),
            "in_flight_settlements_inr": str(Decimal(str(in_flight or 0)).quantize(Decimal("0.01"))),
            "released_earnings_inr": str(Decimal(str(released or 0)).quantize(Decimal("0.01"))),
        }

    async def partner_list(
        self,
        partner_user_id: UUID,
        *,
        page: int = 1,
        page_size: int = 25,
    ) -> tuple[list[dict], int]:
        base = (
            select(Settlement, Laundry.name)
            .join(Laundry, Laundry.id == Settlement.laundry_id)
            .where(Settlement.partner_user_id == partner_user_id)
        )
        total = int(await self._session.scalar(select(func.count()).select_from(base.subquery())) or 0)
        rows = await self._session.execute(
            base.order_by(Settlement.created_at.desc()).offset((page - 1) * page_size).limit(page_size),
        )
        items = []
        for st, laundry_name in rows.all():
            items.append(
                {
                    "id": st.id,
                    "settlement_code": st.settlement_code,
                    "laundry_name": laundry_name,
                    "period_start": st.period_start,
                    "period_end": st.period_end,
                    "orders_count": st.orders_count,
                    "gross_revenue_inr": str(st.gross_revenue_inr),
                    "commission_inr": str(st.commission_inr),
                    "refund_inr": str(st.refund_inr),
                    "adjustment_inr": str(st.adjustment_inr),
                    "net_amount_inr": str(st.net_amount_inr),
                    "status": st.status.value,
                    "created_at": st.created_at,
                    "paid_at": st.paid_at,
                },
            )
        return items, total

    async def add_adjustment(
        self,
        settlement: Settlement,
        *,
        amount_inr: Decimal,
        reason: str,
        created_by_user_id: UUID | None,
    ) -> SettlementAdjustment:
        adj = SettlementAdjustment(
            settlement_id=settlement.id,
            amount_inr=amount_inr,
            reason=reason,
            created_by_user_id=created_by_user_id,
        )
        self._session.add(adj)
        settlement.adjustment_inr = (Decimal(str(settlement.adjustment_inr)) + amount_inr).quantize(Decimal("0.01"))
        settlement.net_amount_inr = (
            Decimal(str(settlement.net_amount_inr)) + amount_inr
        ).quantize(Decimal("0.01"))
        await self._session.flush()
        return adj

    async def mark_orders_settled(self, settlement_id: UUID) -> None:
        await self._session.execute(
            select(Order).where(Order.settlement_id == settlement_id),
        )
        rows = await self._session.scalars(select(Order).where(Order.settlement_id == settlement_id))
        for order in rows.all():
            order.settlement_eligibility = SettlementEligibility.settled
