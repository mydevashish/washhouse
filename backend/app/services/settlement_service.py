"""Settlement & payout business logic."""

from __future__ import annotations

import csv
import io
from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, ValidationError
from app.core.pagination import build_paginated_response
from app.models.enums import (
    AuditAction,
    ComplaintStatus,
    OrderStatus,
    SettlementEligibility,
    SettlementStatus,
)
from app.models.laundry import Laundry
from app.models.order import Order
from app.models.settlement import Settlement
from app.repositories.audit import AuditRepository
from app.repositories.settlement import SettlementRepository
from app.services.settlement_calculator import dispute_window_end, utc_now

_OPEN_COMPLAINT = (
    ComplaintStatus.open,
    ComplaintStatus.investigating,
    ComplaintStatus.awaiting_customer,
    ComplaintStatus.awaiting_partner,
    ComplaintStatus.escalated,
)


class SettlementService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = SettlementRepository(session)
        self._audit = AuditRepository(session)

    async def on_order_delivered(self, order: Order) -> None:
        """Called when order is marked delivered — start configurable dispute window."""
        from app.services.platform_config_service import PlatformConfigService

        now = utc_now()
        hours = await PlatformConfigService(self._session).get_dispute_window_hours()
        order.delivered_at = now
        order.settlement_eligible_at = dispute_window_end(now, hours=hours)
        order.settlement_eligibility = SettlementEligibility.pending_window

    async def on_complaint_opened(self, order_id: UUID) -> None:
        order = await self._session.get(Order, order_id)
        if order and order.settlement_eligibility in (
            SettlementEligibility.pending_window,
            SettlementEligibility.eligible,
        ):
            order.settlement_eligibility = SettlementEligibility.held_dispute

    async def scan_eligibility(self) -> int:
        """Mark orders past dispute window as eligible (if no open complaints)."""
        now = utc_now()
        rows = await self._session.scalars(
            select(Order).where(
                Order.deleted_at.is_(None),
                Order.status == OrderStatus.delivered,
                Order.settlement_id.is_(None),
                Order.settlement_eligibility.in_(
                    (SettlementEligibility.pending_window, SettlementEligibility.held_dispute),
                ),
                Order.delivered_at.isnot(None),
            ),
        )
        updated = 0
        from app.services.platform_config_service import PlatformConfigService

        dispute_hours = await PlatformConfigService(self._session).get_dispute_window_hours()
        for order in rows.all():
            if order.delivered_at is None:
                continue
            eligible_at = dispute_window_end(order.delivered_at, hours=dispute_hours)
            if now < eligible_at:
                continue
            if await self._repo.order_has_open_complaint(order.id):
                if order.settlement_eligibility != SettlementEligibility.held_dispute:
                    order.settlement_eligibility = SettlementEligibility.held_dispute
                    updated += 1
                continue
            order.settlement_eligible_at = eligible_at
            order.settlement_eligibility = SettlementEligibility.eligible
            updated += 1
        return updated

    async def create_settlements_from_eligible(self, *, actor_user_id: UUID | None = None) -> int:
        """Batch eligible orders into pending settlements grouped by laundry."""
        await self.scan_eligibility()
        orders = await self._repo.list_eligible_orders()
        if not orders:
            return 0

        by_laundry: dict[UUID, list[Order]] = {}
        for order in orders:
            by_laundry.setdefault(order.laundry_id, []).append(order)

        created = 0
        for laundry_id, laundry_orders in by_laundry.items():
            laundry = await self._session.get(Laundry, laundry_id)
            if not laundry:
                continue
            period_start = min(o.delivered_at or o.created_at for o in laundry_orders)
            period_end = max(o.delivered_at or o.created_at for o in laundry_orders)
            settlement = await self._repo.create_settlement(
                laundry_id=laundry_id,
                partner_user_id=laundry.owner_user_id,
                period_start=period_start,
                period_end=period_end,
                orders=laundry_orders,
            )
            await self._audit.log(
                action=AuditAction.settlement_created,
                actor_user_id=actor_user_id,
                resource_type="settlement",
                resource_id=str(settlement.id),
                metadata={
                    "settlement_code": settlement.settlement_code,
                    "laundry_id": str(laundry_id),
                    "orders_count": settlement.orders_count,
                    "net_amount_inr": str(settlement.net_amount_inr),
                },
            )
            created += 1
        return created

    async def dashboard(self) -> dict:
        return await self._repo.dashboard_metrics()

    async def analytics(self) -> dict:
        return await self._repo.analytics()

    async def audit_log(self, *, settlement_id: UUID | None = None, limit: int = 50) -> list[dict]:
        settlement_actions = (
            AuditAction.settlement_created,
            AuditAction.settlement_approved,
            AuditAction.settlement_rejected,
            AuditAction.settlement_payout_released,
            AuditAction.settlement_adjustment,
            AuditAction.settlement_status_change,
            AuditAction.settlement_held,
            AuditAction.settlement_released_from_hold,
        )
        rows: list[dict] = []
        for action in settlement_actions:
            part = await self._audit.list_logs(
                action=action,
                resource_type="settlement",
                resource_id=str(settlement_id) if settlement_id else None,
                limit=limit,
            )
            rows.extend(part)
        rows.sort(key=lambda r: r["timestamp"], reverse=True)
        trimmed = rows[:limit]
        result = []
        for row in trimmed:
            meta = row.get("metadata") or {}
            result.append(
                {
                    "id": row["id"],
                    "timestamp": row["timestamp"],
                    "user_name": row["user_name"],
                    "action": row["action"],
                    "settlement_id": row.get("resource_id"),
                    "settlement_code": meta.get("settlement_code"),
                    "old_value": row.get("old_value") or meta.get("old_status"),
                    "new_value": row.get("new_value") or meta.get("new_status"),
                    "note": meta.get("reason") or meta.get("note"),
                },
            )
        return result

    async def admin_table(
        self,
        *,
        status: str | None = None,
        laundry_id: UUID | None = None,
        partner_id: UUID | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        page: int = 1,
        page_size: int = 25,
        sort_by: str = "created_at",
        sort_dir: str = "desc",
    ) -> dict:
        st = SettlementStatus(status) if status else None
        items, total = await self._repo.admin_table(
            status=st,
            laundry_id=laundry_id,
            partner_id=partner_id,
            date_from=date_from,
            date_to=date_to,
            page=page,
            page_size=page_size,
            sort_by=sort_by,
            sort_dir=sort_dir,
        )
        total_pages = max(1, (total + page_size - 1) // page_size)
        page = max(1, page)
        payload = build_paginated_response(
            items=items,
            total_records=total,
            page=page,
            page_size=page_size,
        )
        payload["total"] = total
        return payload

    async def get_detail(self, settlement_id: UUID) -> dict:
        st = await self._repo.get_by_id(settlement_id)
        if not st:
            raise NotFoundError("Settlement not found")
        laundry = await self._session.get(Laundry, st.laundry_id)
        from app.models.user import User

        partner = await self._session.get(User, st.partner_user_id)
        return {
            "id": st.id,
            "settlement_code": st.settlement_code,
            "laundry_id": st.laundry_id,
            "laundry_name": laundry.name if laundry else "—",
            "partner_user_id": st.partner_user_id,
            "partner_name": partner.full_name if partner else "—",
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
            "approved_at": st.approved_at,
            "paid_at": st.paid_at,
            "payout_reference": st.payout_reference,
            "failed_reason": st.failed_reason,
            "cancelled_reason": st.cancelled_reason,
            "notes": st.notes,
            "held_at": st.held_at,
            "held_reason": st.held_reason,
            "line_items": [
                {
                    "order_id": li.order_id,
                    "gross_inr": str(li.gross_inr),
                    "commission_inr": str(li.commission_inr),
                    "refund_inr": str(li.refund_inr),
                    "net_inr": str(li.net_inr),
                }
                for li in st.line_items
            ],
            "adjustments": [
                {
                    "id": a.id,
                    "amount_inr": str(a.amount_inr),
                    "reason": a.reason,
                    "created_at": a.created_at,
                }
                for a in st.adjustments
            ],
        }

    async def _transition(
        self,
        settlement: Settlement,
        *,
        to_status: SettlementStatus,
        actor_user_id: UUID | None,
        audit_action: AuditAction,
        metadata: dict | None = None,
    ) -> Settlement:
        old = settlement.status.value
        settlement.status = to_status
        meta = {"old_status": old, "new_status": to_status.value, **(metadata or {})}
        await self._audit.log(
            action=audit_action,
            actor_user_id=actor_user_id,
            resource_type="settlement",
            resource_id=str(settlement.id),
            metadata=meta,
        )
        return settlement

    async def approve(self, settlement_id: UUID, *, actor_user_id: UUID) -> dict:
        st = await self._repo.get_by_id(settlement_id)
        if not st:
            raise NotFoundError("Settlement not found")
        if st.status != SettlementStatus.pending:
            raise ValidationError("Only pending settlements can be approved")
        st.approved_at = utc_now()
        st.approved_by_user_id = actor_user_id
        await self._transition(st, to_status=SettlementStatus.approved, actor_user_id=actor_user_id, audit_action=AuditAction.settlement_approved)
        return await self.get_detail(settlement_id)

    async def hold(self, settlement_id: UUID, *, actor_user_id: UUID, reason: str) -> dict:
        st = await self._repo.get_by_id(settlement_id)
        if not st:
            raise NotFoundError("Settlement not found")
        if st.status not in (SettlementStatus.pending, SettlementStatus.approved, SettlementStatus.processing):
            raise ValidationError("Settlement cannot be held in current status")
        st.status_before_hold = st.status.value
        st.held_at = utc_now()
        st.held_reason = reason
        await self._transition(
            st,
            to_status=SettlementStatus.on_hold,
            actor_user_id=actor_user_id,
            audit_action=AuditAction.settlement_held,
            metadata={"reason": reason, "settlement_code": st.settlement_code},
        )
        return await self.get_detail(settlement_id)

    async def release_from_hold(self, settlement_id: UUID, *, actor_user_id: UUID) -> dict:
        st = await self._repo.get_by_id(settlement_id)
        if not st:
            raise NotFoundError("Settlement not found")
        if st.status != SettlementStatus.on_hold:
            raise ValidationError("Settlement is not on hold")
        restore = SettlementStatus(st.status_before_hold) if st.status_before_hold else SettlementStatus.approved
        st.held_at = None
        st.held_reason = None
        st.status_before_hold = None
        await self._transition(
            st,
            to_status=restore,
            actor_user_id=actor_user_id,
            audit_action=AuditAction.settlement_released_from_hold,
            metadata={"settlement_code": st.settlement_code},
        )
        return await self.get_detail(settlement_id)

    async def reject(self, settlement_id: UUID, *, actor_user_id: UUID, reason: str) -> dict:
        st = await self._repo.get_by_id(settlement_id)
        if not st:
            raise NotFoundError("Settlement not found")
        if st.status not in (SettlementStatus.pending, SettlementStatus.approved, SettlementStatus.on_hold):
            raise ValidationError("Settlement cannot be rejected in current status")
        st.cancelled_reason = reason
        await self._release_orders_from_settlement(st)
        await self._transition(
            st,
            to_status=SettlementStatus.cancelled,
            actor_user_id=actor_user_id,
            audit_action=AuditAction.settlement_rejected,
            metadata={"reason": reason},
        )
        return await self.get_detail(settlement_id)

    async def process(self, settlement_id: UUID, *, actor_user_id: UUID) -> dict:
        st = await self._repo.get_by_id(settlement_id)
        if not st:
            raise NotFoundError("Settlement not found")
        if st.status != SettlementStatus.approved:
            raise ValidationError("Only approved settlements can enter processing")
        await self._transition(
            st,
            to_status=SettlementStatus.processing,
            actor_user_id=actor_user_id,
            audit_action=AuditAction.settlement_status_change,
        )
        return await self.get_detail(settlement_id)

    async def release_payout(
        self,
        settlement_id: UUID,
        *,
        actor_user_id: UUID,
        payout_reference: str,
    ) -> dict:
        st = await self._repo.get_by_id(settlement_id)
        if not st:
            raise NotFoundError("Settlement not found")
        if st.status != SettlementStatus.processing:
            raise ValidationError("Only processing settlements can be paid out")
        st.paid_at = utc_now()
        st.payout_reference = payout_reference
        await self._repo.mark_orders_settled(settlement_id)
        await self._transition(
            st,
            to_status=SettlementStatus.paid,
            actor_user_id=actor_user_id,
            audit_action=AuditAction.settlement_payout_released,
            metadata={"payout_reference": payout_reference, "net_amount_inr": str(st.net_amount_inr)},
        )
        return await self.get_detail(settlement_id)

    async def mark_failed(self, settlement_id: UUID, *, actor_user_id: UUID, reason: str) -> dict:
        st = await self._repo.get_by_id(settlement_id)
        if not st:
            raise NotFoundError("Settlement not found")
        if st.status != SettlementStatus.processing:
            raise ValidationError("Only processing settlements can be marked failed")
        st.failed_reason = reason
        await self._transition(
            st,
            to_status=SettlementStatus.failed,
            actor_user_id=actor_user_id,
            audit_action=AuditAction.settlement_status_change,
            metadata={"reason": reason},
        )
        return await self.get_detail(settlement_id)

    async def add_adjustment(
        self,
        settlement_id: UUID,
        *,
        amount_inr: Decimal,
        reason: str,
        actor_user_id: UUID,
    ) -> dict:
        st = await self._repo.get_by_id(settlement_id)
        if not st:
            raise NotFoundError("Settlement not found")
        if st.status in (SettlementStatus.paid, SettlementStatus.cancelled, SettlementStatus.on_hold):
            raise ValidationError("Cannot adjust paid, cancelled, or held settlements")
        await self._repo.add_adjustment(
            st,
            amount_inr=amount_inr,
            reason=reason,
            created_by_user_id=actor_user_id,
        )
        await self._audit.log(
            action=AuditAction.settlement_adjustment,
            actor_user_id=actor_user_id,
            resource_type="settlement",
            resource_id=str(settlement_id),
            metadata={"amount_inr": str(amount_inr), "reason": reason},
        )
        return await self.get_detail(settlement_id)

    async def _release_orders_from_settlement(self, settlement: Settlement) -> None:
        rows = await self._session.scalars(select(Order).where(Order.settlement_id == settlement.id))
        for order in rows.all():
            order.settlement_id = None
            order.settlement_eligibility = SettlementEligibility.eligible

    async def partner_summary(self, partner_user_id: UUID) -> dict:
        return await self._repo.partner_summary(partner_user_id)

    async def partner_history(self, partner_user_id: UUID, *, page: int = 1, page_size: int = 25) -> dict:
        items, total = await self._repo.partner_list(partner_user_id, page=page, page_size=page_size)
        total_pages = max(1, (total + page_size - 1) // page_size)
        summary = await self._repo.partner_summary(partner_user_id)
        return {**summary, "items": items, "total": total, "page": page, "page_size": page_size, "total_pages": total_pages}

    async def export_csv(
        self,
        *,
        status: str | None = None,
        laundry_id: UUID | None = None,
        partner_id: UUID | None = None,
    ) -> str:
        data = await self.admin_table(
            status=status,
            laundry_id=laundry_id,
            partner_id=partner_id,
            page=1,
            page_size=10_000,
        )
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(
            [
                "Settlement ID",
                "Laundry",
                "Partner",
                "Period Start",
                "Period End",
                "Orders",
                "Gross Revenue",
                "Commission",
                "Refunds",
                "Adjustments",
                "Net Amount",
                "Status",
                "Created",
                "Paid",
            ],
        )
        for row in data["items"]:
            writer.writerow(
                [
                    row["settlement_code"],
                    row["laundry_name"],
                    row["partner_name"],
                    row["period_start"].isoformat(),
                    row["period_end"].isoformat(),
                    row["orders_count"],
                    row["gross_revenue_inr"],
                    row["commission_inr"],
                    row["refund_inr"],
                    row["adjustment_inr"],
                    row["net_amount_inr"],
                    row["status"],
                    row["created_at"].isoformat(),
                    row["paid_at"].isoformat() if row["paid_at"] else "",
                ],
            )
        return buf.getvalue()

    async def export_pdf_report(
        self,
        *,
        status: str | None = None,
        laundry_id: UUID | None = None,
        partner_id: UUID | None = None,
    ) -> str:
        data = await self.admin_table(
            status=status,
            laundry_id=laundry_id,
            partner_id=partner_id,
            page=1,
            page_size=10_000,
        )
        dash = await self.dashboard()
        lines = [
            "DLM SETTLEMENT & PAYOUT REPORT",
            "=" * 72,
            f"Generated: {utc_now().isoformat()}",
            "",
            "SUMMARY",
            "-" * 40,
            f"Pending settlements (INR): {dash['total_pending_settlements_inr']}",
            f"Paid settlements (INR):    {dash['total_paid_settlements_inr']}",
            f"On hold (INR):             {dash.get('on_hold_inr', '0.00')}",
            f"Today's payouts (INR):     {dash['today_payouts_inr']}",
            f"Monthly payouts (INR):     {dash['monthly_payouts_inr']}",
            f"Platform commission (INR): {dash['platform_commission_inr']}",
            "",
            "SETTLEMENTS",
            "-" * 40,
        ]
        for row in data["items"]:
            lines.append(
                f"{row['settlement_code']} | {row['laundry_name']} | {row['partner_name']} | "
                f"Orders: {row['orders_count']} | Gross: {row['gross_revenue_inr']} | "
                f"Commission: {row['commission_inr']} | Refunds: {row['refund_inr']} | "
                f"Net: {row['net_amount_inr']} | {row['status'].upper()} | "
                f"Created: {row['created_at'].date()} | "
                f"Paid: {row['paid_at'].date() if row['paid_at'] else '—'}",
            )
        lines.extend(["", f"Total rows: {len(data['items'])}", "", "— End of report —"])
        return "\n".join(lines)
