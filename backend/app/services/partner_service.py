"""Partner inventory, staff, and analytics."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import String, and_, case, cast, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundError
from app.models.enums import OrderSource, OrderStatus, PaymentMethod, PaymentStatus
from app.models.order import Order, OrderInventory, OrderItem
from app.models.partner_staff import PartnerStaff
from app.models.user import User
from app.repositories.inventory import InventoryRepository
from app.repositories.laundry import LaundryRepository
from app.repositories.order import OrderRepository
from app.repositories.staff import StaffRepository
from app.services.fraud_detection_service import FraudDetectionService
from app.services.partner_money_math import (
    empty_money_fields,
    growth_pct_str,
    money_str,
    partner_net,
)
from app.services.platform_config_service import PlatformConfigService

if TYPE_CHECKING:
    from app.api.partner_orders_list_params import PartnerOrdersListParams


def _commission_expr():
    return Order.total_inr * Order.commission_rate / Decimal("100")


_DASHBOARD_IN_PROCESS = (OrderStatus.picked_up, OrderStatus.washing, OrderStatus.ironing)
_DASHBOARD_READY = (OrderStatus.ready, OrderStatus.out_for_delivery)
_REPEAT_MIN_ORDERS = 2


class PartnerService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._laundries = LaundryRepository(session)
        self._orders = OrderRepository(session)
        self._inventory = InventoryRepository(session)
        self._staff = StaffRepository(session)

    async def _laundry_for_partner(self, partner_user_id: UUID):
        laundry = await self._laundries.get_by_owner(partner_user_id)
        if not laundry:
            raise NotFoundError("Partner laundry not found")
        return laundry

    async def _laundry_ids_for_partner(self, partner_user_id: UUID) -> list[UUID]:
        laundries = await self._laundries.list_by_owner(partner_user_id)
        if not laundries:
            raise NotFoundError("Partner laundry not found")
        return [laundry.id for laundry in laundries]

    async def empty_analytics_summary(self, partner_user_id: UUID) -> dict:
        """Dashboard-safe zeros when partner has no laundry yet (e.g. pending onboarding)."""
        from app.repositories.user import UserRepository

        user = await UserRepository(self._session).get_by_id(partner_user_id)
        name = user.full_name if user else "Your laundry"
        money = empty_money_fields()
        return {
            "laundry_id": None,
            "laundry_name": name,
            "avg_rating": "0.00",
            "review_count": 0,
            "orders_total": 0,
            "orders_today": 0,
            "orders_pending": 0,
            "orders_in_progress": 0,
            "orders_ready": 0,
            "pickup_requests": 0,
            "orders_delivered": 0,
            "customers_count": 0,
            "revenue_inr": money_str(0),
            "revenue_today_inr": money_str(0),
            "revenue_this_month_inr": money_str(0),
            "revenue_week_inr": money_str(0),
            **money,
        }

    async def _require_owned_order(self, partner_user_id: UUID, order_id: UUID) -> Order:
        laundry_ids = await self._laundry_ids_for_partner(partner_user_id)
        order = await self._orders.get_by_id(order_id)
        if not order or order.laundry_id not in laundry_ids:
            raise NotFoundError("Order not found")
        return order

    async def get_inventory(self, partner_user_id: UUID, order_id: UUID) -> OrderInventory:
        await self._require_owned_order(partner_user_id, order_id)
        row = await self._inventory.get_by_order(order_id)
        if not row:
            row = OrderInventory(order_id=order_id, expected_count=0, received_count=0)
            await self._inventory.upsert(row)
        return row

    async def update_inventory(
        self,
        partner_user_id: UUID,
        order_id: UUID,
        *,
        expected_count: int,
        received_count: int,
        missing_notes: str | None,
        damaged_notes: str | None,
    ) -> OrderInventory:
        order = await self._require_owned_order(partner_user_id, order_id)
        row = await self._inventory.get_by_order(order_id)
        if not row:
            row = OrderInventory(order_id=order_id)
        row.expected_count = expected_count
        row.received_count = received_count
        row.missing_notes = missing_notes
        row.damaged_notes = damaged_notes
        saved = await self._inventory.upsert(row)
        if received_count < expected_count or missing_notes or damaged_notes:
            await FraudDetectionService(self._session).on_inventory_mismatch(order.laundry_id, order_id)
        return saved

    async def list_staff(self, partner_user_id: UUID) -> list[PartnerStaff]:
        laundry = await self._laundry_for_partner(partner_user_id)
        return await self._staff.list_by_laundry(laundry.id)

    async def create_staff(
        self,
        partner_user_id: UUID,
        *,
        name: str,
        phone: str | None,
        role,
    ) -> PartnerStaff:
        laundry = await self._laundry_for_partner(partner_user_id)
        staff = PartnerStaff(laundry_id=laundry.id, name=name, phone=phone, role=role)
        return await self._staff.create(staff)

    async def update_staff(
        self,
        partner_user_id: UUID,
        staff_id: UUID,
        *,
        name: str | None = None,
        phone: str | None = None,
        role=None,
    ) -> PartnerStaff:
        laundry = await self._laundry_for_partner(partner_user_id)
        staff = await self._staff.get_by_id(staff_id, laundry.id)
        if not staff:
            raise NotFoundError("Staff not found")
        if name is not None:
            staff.name = name
        if phone is not None:
            staff.phone = phone
        if role is not None:
            staff.role = role
        await self._session.flush()
        return staff

    async def delete_staff(self, partner_user_id: UUID, staff_id: UUID) -> None:
        laundry = await self._laundry_for_partner(partner_user_id)
        staff = await self._staff.get_by_id(staff_id, laundry.id)
        if not staff:
            raise NotFoundError("Staff not found")
        await self._staff.soft_delete(staff)

    async def _delivered_gross_commission(
        self,
        laundry_id: UUID,
        *,
        time_col,
        start: datetime | None = None,
        end: datetime | None = None,
        order_source: OrderSource | None = None,
        exclude_walk_in: bool = False,
    ) -> tuple[Decimal, Decimal]:
        """Sum delivered gross + snapshotted commission for a time window."""
        clauses = [
            Order.laundry_id == laundry_id,
            Order.deleted_at.is_(None),
            Order.status == OrderStatus.delivered,
        ]
        if start is not None:
            clauses.append(time_col >= start)
        if end is not None:
            clauses.append(time_col < end)
        if order_source is not None:
            clauses.append(Order.order_source == order_source)
        if exclude_walk_in:
            clauses.append(Order.order_source != OrderSource.walk_in)

        result = await self._session.execute(
            select(
                func.coalesce(func.sum(Order.total_inr), 0),
                func.coalesce(func.sum(_commission_expr()), 0),
            ).where(and_(*clauses)),
        )
        row = result.one()
        return Decimal(str(row[0] or 0)), Decimal(str(row[1] or 0))

    async def analytics_summary(self, partner_user_id: UUID) -> dict:
        laundry = await self._laundry_for_partner(partner_user_id)
        pending_statuses = (OrderStatus.confirmed, OrderStatus.pickup_assigned)
        in_progress = (
            OrderStatus.picked_up,
            OrderStatus.washing,
            OrderStatus.ironing,
            OrderStatus.ready,
            OrderStatus.out_for_delivery,
        )

        async def count_where(*statuses: OrderStatus) -> int:
            result = await self._session.execute(
                select(func.count())
                .select_from(Order)
                .where(
                    Order.laundry_id == laundry.id,
                    Order.deleted_at.is_(None),
                    Order.status.in_(statuses),
                ),
            )
            return int(result.scalar() or 0)

        all_result = await self._session.execute(
            select(func.count())
            .select_from(Order)
            .where(Order.laundry_id == laundry.id, Order.deleted_at.is_(None)),
        )
        total = int(all_result.scalar() or 0)

        revenue_all, _ = await self._delivered_gross_commission(laundry.id, time_col=Order.updated_at)

        now = datetime.now(UTC)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        yesterday_start = today_start - timedelta(days=1)
        week_start = today_start - timedelta(days=today_start.weekday())
        prev_week_start = week_start - timedelta(days=7)
        month_start = today_start.replace(day=1)
        if month_start.month == 1:
            prev_month_start = month_start.replace(year=month_start.year - 1, month=12)
        else:
            prev_month_start = month_start.replace(month=month_start.month - 1)

        customers_result = await self._session.execute(
            select(func.count(func.distinct(Order.user_id))).where(
                Order.laundry_id == laundry.id,
                Order.deleted_at.is_(None),
            ),
        )
        customers_count = int(customers_result.scalar() or 0)

        today_orders_result = await self._session.execute(
            select(func.count())
            .select_from(Order)
            .where(
                Order.laundry_id == laundry.id,
                Order.deleted_at.is_(None),
                Order.created_at >= today_start,
            ),
        )
        orders_today = int(today_orders_result.scalar() or 0)

        # Today / week / yesterday: delivered by updated_at (legacy today/week KPIs)
        revenue_today, commission_today = await self._delivered_gross_commission(
            laundry.id, time_col=Order.updated_at, start=today_start,
        )
        revenue_yesterday, _ = await self._delivered_gross_commission(
            laundry.id, time_col=Order.updated_at, start=yesterday_start, end=today_start,
        )
        revenue_week, commission_week = await self._delivered_gross_commission(
            laundry.id, time_col=Order.updated_at, start=week_start,
        )
        revenue_prev_week, _ = await self._delivered_gross_commission(
            laundry.id, time_col=Order.updated_at, start=prev_week_start, end=week_start,
        )
        # Month: delivered by created_at (legacy revenue_this_month_inr)
        revenue_month, commission_month = await self._delivered_gross_commission(
            laundry.id, time_col=Order.created_at, start=month_start,
        )
        revenue_prev_month, _ = await self._delivered_gross_commission(
            laundry.id, time_col=Order.created_at, start=prev_month_start, end=month_start,
        )

        walk_today, _ = await self._delivered_gross_commission(
            laundry.id,
            time_col=Order.updated_at,
            start=today_start,
            order_source=OrderSource.walk_in,
        )
        door_today, _ = await self._delivered_gross_commission(
            laundry.id,
            time_col=Order.updated_at,
            start=today_start,
            exclude_walk_in=True,
        )
        walk_week, _ = await self._delivered_gross_commission(
            laundry.id,
            time_col=Order.updated_at,
            start=week_start,
            order_source=OrderSource.walk_in,
        )
        door_week, _ = await self._delivered_gross_commission(
            laundry.id,
            time_col=Order.updated_at,
            start=week_start,
            exclude_walk_in=True,
        )
        walk_month, _ = await self._delivered_gross_commission(
            laundry.id,
            time_col=Order.created_at,
            start=month_start,
            order_source=OrderSource.walk_in,
        )
        door_month, _ = await self._delivered_gross_commission(
            laundry.id,
            time_col=Order.created_at,
            start=month_start,
            exclude_walk_in=True,
        )

        effective_rate = await PlatformConfigService(self._session).resolve_commission_rate(laundry)

        return {
            "laundry_id": laundry.id,
            "laundry_name": laundry.name,
            "avg_rating": str(laundry.avg_rating.quantize(Decimal("0.01"))),
            "review_count": laundry.review_count,
            "orders_total": total,
            "orders_today": orders_today,
            "orders_pending": await count_where(*pending_statuses),
            "orders_in_progress": await count_where(*in_progress),
            "orders_ready": await count_where(OrderStatus.ready),
            "pickup_requests": await count_where(OrderStatus.confirmed),
            "orders_delivered": await count_where(OrderStatus.delivered),
            "customers_count": customers_count,
            "revenue_inr": money_str(revenue_all),
            "revenue_today_inr": money_str(revenue_today),
            "revenue_this_month_inr": money_str(revenue_month),
            "revenue_week_inr": money_str(revenue_week),
            "revenue_yesterday_inr": money_str(revenue_yesterday),
            "revenue_prev_week_inr": money_str(revenue_prev_week),
            "revenue_prev_month_inr": money_str(revenue_prev_month),
            "growth_today_pct": growth_pct_str(revenue_today, revenue_yesterday),
            "growth_week_pct": growth_pct_str(revenue_week, revenue_prev_week),
            "growth_month_pct": growth_pct_str(revenue_month, revenue_prev_month),
            "effective_commission_rate": money_str(effective_rate),
            "commission_today_inr": money_str(commission_today),
            "commission_week_inr": money_str(commission_week),
            "commission_month_inr": money_str(commission_month),
            "partner_net_today_inr": money_str(partner_net(revenue_today, commission_today)),
            "partner_net_week_inr": money_str(partner_net(revenue_week, commission_week)),
            "partner_net_month_inr": money_str(partner_net(revenue_month, commission_month)),
            "revenue_walk_in_today_inr": money_str(walk_today),
            "revenue_doorstep_today_inr": money_str(door_today),
            "revenue_walk_in_week_inr": money_str(walk_week),
            "revenue_doorstep_week_inr": money_str(door_week),
            "revenue_walk_in_month_inr": money_str(walk_month),
            "revenue_doorstep_month_inr": money_str(door_month),
        }

    async def empty_analytics_overview(self, partner_user_id: UUID, period_key: str) -> dict:
        """Zeros when partner has no laundry yet (matches empty_analytics_summary pattern)."""
        from app.services.partner_analytics_period import (
            parse_partner_overview_period,
            resolve_partner_overview_period,
        )

        period = parse_partner_overview_period(period_key)
        bounds = resolve_partner_overview_period(period)
        empty_series = [
            {
                "bucket_label": b.bucket_label,
                "bucket_start_utc": b.bucket_start_utc.isoformat(),
                "orders_count": 0,
                "pending_orders_count": 0,
                "pending_payment_count": 0,
                "pending_payment_inr": money_str(0),
                "customers_count": 0,
                "revenue_gross_inr": money_str(0),
                "revenue_net_inr": money_str(0),
            }
            for b in bounds.chart_buckets
        ]
        money = empty_money_fields()
        return {
            "period": period.value,
            "period_label_ist": bounds.period_label_ist,
            "period_start_utc": bounds.period_start_utc.isoformat(),
            "period_end_utc": bounds.period_end_utc.isoformat(),
            "orders_count": 0,
            "pending_orders_count": 0,
            "revenue_gross_inr": money_str(0),
            "revenue_net_inr": money_str(0),
            "commission_inr": money_str(0),
            "effective_commission_rate": money["effective_commission_rate"],
            "pending_payment_count": 0,
            "pending_payment_inr": money_str(0),
            "customers_count_period": 0,
            "customers_count_all_time": 0,
            "chart_series": empty_series,
        }

    async def analytics_overview(self, partner_user_id: UUID, period_key: str) -> dict:
        from sqlalchemy import String, cast, or_

        from app.models.enums import PaymentStatus
        from app.services.partner_analytics_period import (
            bucket_key_from_def,
            ist_sql_bucket_key,
            parse_partner_overview_period,
            resolve_partner_overview_period,
        )

        laundry = await self._laundry_for_partner(partner_user_id)
        period = parse_partner_overview_period(period_key)
        bounds = resolve_partner_overview_period(period)
        start = bounds.period_start_utc
        end = bounds.period_end_utc
        terminal = (OrderStatus.delivered, OrderStatus.cancelled)
        granularity = "hour" if period.value == "today" else "day"

        base = and_(
            Order.laundry_id == laundry.id,
            Order.deleted_at.is_(None),
        )

        orders_count = int(
            await self._session.scalar(
                select(func.count())
                .select_from(Order)
                .where(base, Order.created_at >= start, Order.created_at < end),
            )
            or 0,
        )

        pending_orders_count = int(
            await self._session.scalar(
                select(func.count())
                .select_from(Order)
                .where(
                    base,
                    Order.created_at >= start,
                    Order.created_at < end,
                    Order.status.notin_(terminal),
                ),
            )
            or 0,
        )

        revenue_gross, commission_total = await self._delivered_gross_commission(
            laundry.id,
            time_col=Order.updated_at,
            start=start,
            end=end,
        )
        revenue_net = partner_net(revenue_gross, commission_total)

        unpaid_filter = Order.payment_status.in_((PaymentStatus.pending, PaymentStatus.pending_cod))
        pending_payment_count = int(
            await self._session.scalar(
                select(func.count())
                .select_from(Order)
                .where(
                    base,
                    Order.created_at >= start,
                    Order.created_at < end,
                    unpaid_filter,
                ),
            )
            or 0,
        )
        pending_payment_sum = await self._session.scalar(
            select(func.coalesce(func.sum(Order.total_inr), 0)).where(
                base,
                Order.created_at >= start,
                Order.created_at < end,
                unpaid_filter,
            ),
        )
        pending_payment_inr = Decimal(str(pending_payment_sum or 0))

        customer_key = func.coalesce(cast(Order.user_id, String), Order.customer_phone)
        customers_count_period = int(
            await self._session.scalar(
                select(func.count(func.distinct(customer_key))).where(
                    base,
                    Order.created_at >= start,
                    Order.created_at < end,
                    or_(Order.user_id.isnot(None), Order.customer_phone.isnot(None)),
                ),
            )
            or 0,
        )
        customers_count_all_time = int(
            await self._session.scalar(
                select(func.count(func.distinct(customer_key))).where(
                    base,
                    or_(Order.user_id.isnot(None), Order.customer_phone.isnot(None)),
                ),
            )
            or 0,
        )

        created_bucket = func.date_trunc(
            granularity,
            func.timezone("Asia/Kolkata", Order.created_at),
        )
        created_rows = await self._session.execute(
            select(
                created_bucket.label("bucket"),
                func.count().label("cnt"),
            )
            .where(base, Order.created_at >= start, Order.created_at < end)
            .group_by(created_bucket),
        )
        orders_by_bucket = {
            ist_sql_bucket_key(row.bucket, granularity=granularity): int(row.cnt)
            for row in created_rows.all()
        }

        pending_rows = await self._session.execute(
            select(
                created_bucket.label("bucket"),
                func.count().label("cnt"),
            )
            .where(
                base,
                Order.created_at >= start,
                Order.created_at < end,
                Order.status.notin_(terminal),
            )
            .group_by(created_bucket),
        )
        pending_by_bucket = {
            ist_sql_bucket_key(row.bucket, granularity=granularity): int(row.cnt)
            for row in pending_rows.all()
        }

        pending_pay_rows = await self._session.execute(
            select(
                created_bucket.label("bucket"),
                func.count().label("cnt"),
                func.coalesce(func.sum(Order.total_inr), 0).label("inr"),
            )
            .where(
                base,
                Order.created_at >= start,
                Order.created_at < end,
                unpaid_filter,
            )
            .group_by(created_bucket),
        )
        pending_pay_count_by_bucket: dict[object, int] = {}
        pending_pay_inr_by_bucket: dict[object, Decimal] = {}
        for row in pending_pay_rows.all():
            key = ist_sql_bucket_key(row.bucket, granularity=granularity)
            pending_pay_count_by_bucket[key] = int(row.cnt)
            pending_pay_inr_by_bucket[key] = Decimal(str(row.inr or 0))

        customers_rows = await self._session.execute(
            select(
                created_bucket.label("bucket"),
                func.count(func.distinct(customer_key)).label("cnt"),
            )
            .where(
                base,
                Order.created_at >= start,
                Order.created_at < end,
                or_(Order.user_id.isnot(None), Order.customer_phone.isnot(None)),
            )
            .group_by(created_bucket),
        )
        customers_by_bucket = {
            ist_sql_bucket_key(row.bucket, granularity=granularity): int(row.cnt)
            for row in customers_rows.all()
        }

        delivered_bucket = func.date_trunc(
            granularity,
            func.timezone("Asia/Kolkata", Order.updated_at),
        )
        revenue_rows = await self._session.execute(
            select(
                delivered_bucket.label("bucket"),
                func.coalesce(func.sum(Order.total_inr), 0).label("gross"),
                func.coalesce(func.sum(_commission_expr()), 0).label("commission"),
            )
            .where(
                base,
                Order.status == OrderStatus.delivered,
                Order.updated_at >= start,
                Order.updated_at < end,
            )
            .group_by(delivered_bucket),
        )
        revenue_by_bucket: dict[object, tuple[Decimal, Decimal]] = {}
        for row in revenue_rows.all():
            key = ist_sql_bucket_key(row.bucket, granularity=granularity)
            revenue_by_bucket[key] = (
                Decimal(str(row.gross or 0)),
                Decimal(str(row.commission or 0)),
            )

        chart_series = []
        for bucket_def in bounds.chart_buckets:
            key = bucket_key_from_def(bucket_def, granularity=granularity)
            orders_in_bucket = orders_by_bucket.get(key, 0)
            gross, comm = revenue_by_bucket.get(key, (Decimal("0"), Decimal("0")))
            chart_series.append(
                {
                    "bucket_label": bucket_def.bucket_label,
                    "bucket_start_utc": bucket_def.bucket_start_utc.isoformat(),
                    "orders_count": orders_in_bucket,
                    "pending_orders_count": pending_by_bucket.get(key, 0),
                    "pending_payment_count": pending_pay_count_by_bucket.get(key, 0),
                    "pending_payment_inr": money_str(pending_pay_inr_by_bucket.get(key, Decimal("0"))),
                    "customers_count": customers_by_bucket.get(key, 0),
                    "revenue_gross_inr": money_str(gross),
                    "revenue_net_inr": money_str(partner_net(gross, comm)),
                },
            )

        effective_rate = await PlatformConfigService(self._session).resolve_commission_rate(laundry)

        return {
            "period": period.value,
            "period_label_ist": bounds.period_label_ist,
            "period_start_utc": bounds.period_start_utc.isoformat(),
            "period_end_utc": bounds.period_end_utc.isoformat(),
            "orders_count": orders_count,
            "pending_orders_count": pending_orders_count,
            "revenue_gross_inr": money_str(revenue_gross),
            "revenue_net_inr": money_str(revenue_net),
            "commission_inr": money_str(commission_total),
            "effective_commission_rate": money_str(effective_rate),
            "pending_payment_count": pending_payment_count,
            "pending_payment_inr": money_str(pending_payment_inr),
            "customers_count_period": customers_count_period,
            "customers_count_all_time": customers_count_all_time,
            "chart_series": chart_series,
        }

    def _empty_dashboard_kpis(self) -> dict:
        zero = money_str(0)
        return {
            "orders_today": 0,
            "orders_yesterday": 0,
            "orders_week": 0,
            "orders_prev_week": 0,
            "orders_month": 0,
            "orders_prev_month": 0,
            "revenue_today_inr": zero,
            "revenue_yesterday_inr": zero,
            "revenue_week_inr": zero,
            "revenue_prev_week_inr": zero,
            "revenue_month_inr": zero,
            "revenue_prev_month_inr": zero,
        }

    async def empty_analytics_dashboard(self, partner_user_id: UUID, period_key: str) -> dict:
        from app.repositories.user import UserRepository
        from app.services.partner_analytics_period import (
            parse_partner_dashboard_period,
            resolve_partner_dashboard_period,
        )

        user = await UserRepository(self._session).get_by_id(partner_user_id)
        name = user.full_name if user else "Your laundry"
        period = parse_partner_dashboard_period(period_key)
        bounds = resolve_partner_dashboard_period(period)
        zero = money_str(0)
        return {
            "laundry_id": None,
            "laundry_name": name,
            "kpis": self._empty_dashboard_kpis(),
            "status_snapshot": {"in_process": 0, "ready_for_delivery": 0, "completed": 0},
            "period": period.value,
            "period_label_ist": bounds.period_label_ist,
            "chart_series": [
                {
                    "bucket_label": b.bucket_label,
                    "current_revenue_inr": zero,
                    "previous_revenue_inr": zero,
                }
                for b in bounds.chart_buckets
            ],
            "status_donut": {"in_process": 0, "ready": 0, "completed": 0},
            "top_services": [],
            "payment_summary": {
                "cash_paid_inr": zero,
                "upi_paid_inr": zero,
                "wallet_tracked": False,
                "pending_inr": zero,
            },
            "bottom": {
                "customers_total": 0,
                "customers_new_week": 0,
                "customers_repeat": 0,
                "avg_order_value_inr": zero,
                "avg_delivery_minutes": None,
                "avg_rating": "0.00",
                "review_count": 0,
            },
        }

    async def _count_orders_created(
        self,
        laundry_id: UUID,
        start: datetime,
        end: datetime,
    ) -> int:
        return int(
            await self._session.scalar(
                select(func.count())
                .select_from(Order)
                .where(
                    Order.laundry_id == laundry_id,
                    Order.deleted_at.is_(None),
                    Order.created_at >= start,
                    Order.created_at < end,
                ),
            )
            or 0,
        )

    async def _count_status(self, laundry_id: UUID, statuses: tuple[OrderStatus, ...]) -> int:
        return int(
            await self._session.scalar(
                select(func.count())
                .select_from(Order)
                .where(
                    Order.laundry_id == laundry_id,
                    Order.deleted_at.is_(None),
                    Order.status.in_(statuses),
                ),
            )
            or 0,
        )

    async def _revenue_by_bucket_index(
        self,
        laundry_id: UUID,
        buckets: tuple,
        *,
        time_col,
    ) -> dict[int, Decimal]:
        """One grouped query: delivered gross per chart bucket index. Empty-width buckets stay 0."""
        whens: list[tuple] = []
        live = []
        for i, bucket in enumerate(buckets):
            if bucket.bucket_start_utc >= bucket.bucket_end_utc:
                continue
            live.append(bucket)
            whens.append(
                (
                    and_(time_col >= bucket.bucket_start_utc, time_col < bucket.bucket_end_utc),
                    i,
                ),
            )
        zeros = {i: Decimal("0") for i in range(len(buckets))}
        if not whens:
            return zeros
        idx_expr = case(*whens)
        window_start = min(b.bucket_start_utc for b in live)
        window_end = max(b.bucket_end_utc for b in live)
        rows = await self._session.execute(
            select(idx_expr.label("idx"), func.coalesce(func.sum(Order.total_inr), 0))
            .where(
                Order.laundry_id == laundry_id,
                Order.deleted_at.is_(None),
                Order.status == OrderStatus.delivered,
                time_col >= window_start,
                time_col < window_end,
                idx_expr.isnot(None),
            )
            .group_by(idx_expr),
        )
        for idx, amount in rows.all():
            if idx is None:
                continue
            zeros[int(idx)] = Decimal(str(amount or 0))
        return zeros

    async def analytics_dashboard(self, partner_user_id: UUID, period_key: str) -> dict:
        from app.services.partner_analytics_period import (
            parse_partner_dashboard_period,
            resolve_dashboard_kpi_windows,
            resolve_partner_dashboard_period,
        )

        laundry = await self._laundry_for_partner(partner_user_id)
        period = parse_partner_dashboard_period(period_key)
        bounds = resolve_partner_dashboard_period(period)
        windows = resolve_dashboard_kpi_windows()
        base = and_(Order.laundry_id == laundry.id, Order.deleted_at.is_(None))
        customer_key = func.coalesce(cast(Order.user_id, String), Order.customer_phone)

        async def created_count(key: str) -> int:
            start, end = windows[key]
            return await self._count_orders_created(laundry.id, start, end)

        async def delivered_gross(key: str) -> Decimal:
            start, end = windows[key]
            gross, _ = await self._delivered_gross_commission(
                laundry.id,
                time_col=Order.updated_at,
                start=start,
                end=end,
            )
            return gross

        kpis = {
            "orders_today": await created_count("today"),
            "orders_yesterday": await created_count("yesterday"),
            "orders_week": await created_count("week"),
            "orders_prev_week": await created_count("prev_week"),
            "orders_month": await created_count("month"),
            "orders_prev_month": await created_count("prev_month"),
            "revenue_today_inr": money_str(await delivered_gross("today")),
            "revenue_yesterday_inr": money_str(await delivered_gross("yesterday")),
            "revenue_week_inr": money_str(await delivered_gross("week")),
            "revenue_prev_week_inr": money_str(await delivered_gross("prev_week")),
            "revenue_month_inr": money_str(await delivered_gross("month")),
            "revenue_prev_month_inr": money_str(await delivered_gross("prev_month")),
        }

        status_snapshot = {
            "in_process": await self._count_status(laundry.id, _DASHBOARD_IN_PROCESS),
            "ready_for_delivery": await self._count_status(laundry.id, _DASHBOARD_READY),
            "completed": await self._count_status(laundry.id, (OrderStatus.delivered,)),
        }

        current_rev = await self._revenue_by_bucket_index(
            laundry.id,
            bounds.chart_buckets,
            time_col=Order.updated_at,
        )
        previous_rev = await self._revenue_by_bucket_index(
            laundry.id,
            bounds.previous_chart_buckets,
            time_col=Order.updated_at,
        )
        chart_series = [
            {
                "bucket_label": bucket.bucket_label,
                "current_revenue_inr": money_str(current_rev.get(i, Decimal("0"))),
                "previous_revenue_inr": money_str(previous_rev.get(i, Decimal("0"))),
            }
            for i, bucket in enumerate(bounds.chart_buckets)
        ]

        period_start = bounds.period_start_utc
        period_end = bounds.period_end_utc
        donut_rows = await self._session.execute(
            select(Order.status, func.count())
            .where(
                base,
                Order.created_at >= period_start,
                Order.created_at < period_end,
                Order.status.in_((*_DASHBOARD_IN_PROCESS, *_DASHBOARD_READY, OrderStatus.delivered)),
            )
            .group_by(Order.status),
        )
        donut_counts = {row[0]: int(row[1]) for row in donut_rows.all()}
        status_donut = {
            "in_process": sum(donut_counts.get(s, 0) for s in _DASHBOARD_IN_PROCESS),
            "ready": sum(donut_counts.get(s, 0) for s in _DASHBOARD_READY),
            "completed": donut_counts.get(OrderStatus.delivered, 0),
        }

        total_lines = int(
            await self._session.scalar(
                select(func.coalesce(func.sum(OrderItem.quantity), 0))
                .select_from(OrderItem)
                .join(Order, OrderItem.order_id == Order.id)
                .where(
                    base,
                    Order.created_at >= period_start,
                    Order.created_at < period_end,
                ),
            )
            or 0,
        )
        top_rows = await self._session.execute(
            select(
                OrderItem.service_name,
                func.coalesce(func.sum(OrderItem.quantity), 0).label("qty"),
            )
            .select_from(OrderItem)
            .join(Order, OrderItem.order_id == Order.id)
            .where(
                base,
                Order.created_at >= period_start,
                Order.created_at < period_end,
            )
            .group_by(OrderItem.service_name)
            .order_by(func.coalesce(func.sum(OrderItem.quantity), 0).desc())
            .limit(4),
        )
        top_services = []
        for name, qty in top_rows.all():
            lines = int(qty or 0)
            share = (Decimal(lines) / Decimal(total_lines) * Decimal("100")) if total_lines else Decimal("0")
            top_services.append(
                {
                    "name": name,
                    "order_lines": lines,
                    "share_pct": str(share.quantize(Decimal("0.1"))),
                },
            )

        async def sum_paid(method: PaymentMethod) -> Decimal:
            value = await self._session.scalar(
                select(func.coalesce(func.sum(Order.total_inr), 0)).where(
                    base,
                    Order.created_at >= period_start,
                    Order.created_at < period_end,
                    Order.payment_method == method,
                    Order.payment_status == PaymentStatus.paid,
                ),
            )
            return Decimal(str(value or 0))

        pending_inr = Decimal(
            str(
                await self._session.scalar(
                    select(func.coalesce(func.sum(Order.total_inr), 0)).where(
                        base,
                        Order.created_at >= period_start,
                        Order.created_at < period_end,
                        Order.payment_status.in_((PaymentStatus.pending, PaymentStatus.pending_cod)),
                    ),
                )
                or 0,
            ),
        )
        payment_summary = {
            "cash_paid_inr": money_str(await sum_paid(PaymentMethod.cod)),
            "upi_paid_inr": money_str(await sum_paid(PaymentMethod.razorpay)),
            "wallet_tracked": False,
            "pending_inr": money_str(pending_inr),
        }

        customers_total = int(
            await self._session.scalar(
                select(func.count(func.distinct(customer_key))).where(
                    base,
                    or_(Order.user_id.isnot(None), Order.customer_phone.isnot(None)),
                ),
            )
            or 0,
        )
        first_order = (
            select(
                customer_key.label("ckey"),
                func.min(Order.created_at).label("first_at"),
            )
            .where(
                base,
                or_(Order.user_id.isnot(None), Order.customer_phone.isnot(None)),
            )
            .group_by(customer_key)
            .subquery()
        )
        week_start, week_end = windows["week"]
        customers_new_week = int(
            await self._session.scalar(
                select(func.count())
                .select_from(first_order)
                .where(first_order.c.first_at >= week_start, first_order.c.first_at < week_end),
            )
            or 0,
        )
        repeat_sub = (
            select(customer_key)
            .where(
                base,
                or_(Order.user_id.isnot(None), Order.customer_phone.isnot(None)),
            )
            .group_by(customer_key)
            .having(func.count() >= _REPEAT_MIN_ORDERS)
            .subquery()
        )
        customers_repeat = int(
            await self._session.scalar(select(func.count()).select_from(repeat_sub)) or 0,
        )
        totals_row = (
            await self._session.execute(
                select(
                    func.coalesce(func.sum(Order.total_inr), 0),
                    func.count(),
                ).where(base),
            )
        ).one()
        order_sum = Decimal(str(totals_row[0] or 0))
        order_count = int(totals_row[1] or 0)
        avg_order = (order_sum / order_count) if order_count else Decimal("0")
        duration_minutes = (
            func.extract(
                "epoch",
                func.coalesce(Order.delivered_at, Order.updated_at) - Order.pickup_at,
            )
            / 60.0
        )
        avg_delivery = await self._session.scalar(
            select(func.avg(duration_minutes)).where(
                base,
                Order.status == OrderStatus.delivered,
                Order.pickup_at.isnot(None),
                duration_minutes >= 0,
            ),
        )
        avg_delivery_minutes = round(float(avg_delivery), 1) if avg_delivery is not None else None

        return {
            "laundry_id": laundry.id,
            "laundry_name": laundry.name,
            "kpis": kpis,
            "status_snapshot": status_snapshot,
            "period": period.value,
            "period_label_ist": bounds.period_label_ist,
            "chart_series": chart_series,
            "status_donut": status_donut,
            "top_services": top_services,
            "payment_summary": payment_summary,
            "bottom": {
                "customers_total": customers_total,
                "customers_new_week": customers_new_week,
                "customers_repeat": customers_repeat,
                "avg_order_value_inr": money_str(avg_order),
                "avg_delivery_minutes": avg_delivery_minutes,
                "avg_rating": str(laundry.avg_rating.quantize(Decimal("0.01"))),
                "review_count": laundry.review_count,
            },
        }

    async def list_customers(self, partner_user_id: UUID) -> list[dict]:
        laundry_ids = await self._laundry_ids_for_partner(partner_user_id)
        result = await self._session.execute(
            select(
                Order.user_id,
                User.full_name,
                func.count(Order.id).label("order_count"),
                func.coalesce(func.sum(Order.total_inr), 0).label("total_spent"),
                func.max(Order.created_at).label("last_order_at"),
            )
            .join(User, User.id == Order.user_id)
            .where(Order.laundry_id.in_(laundry_ids), Order.deleted_at.is_(None))
            .group_by(Order.user_id, User.full_name)
            .order_by(func.max(Order.created_at).desc()),
        )
        rows = []
        for row in result.all():
            total = Decimal(str(row.total_spent or 0)).quantize(Decimal("0.01"))
            last_at = row.last_order_at
            rows.append(
                {
                    "user_id": row.user_id,
                    "name": row.full_name,
                    "order_count": int(row.order_count),
                    "total_spent_inr": str(total),
                    "last_order_at": last_at.isoformat() if last_at else None,
                },
            )
        return rows

    async def list_orders_for_partner(self, partner_user_id: UUID) -> list[tuple[Order, str]]:
        """Legacy helper — prefer ``list_orders_for_partner_paginated``."""
        from app.api.partner_orders_list_params import PartnerOrdersListParams
        from app.core.pagination import SortOrder

        result = await self.list_orders_for_partner_paginated(
            partner_user_id,
            PartnerOrdersListParams(
                page=1,
                page_size=50,
                search=None,
                sort_by="created_at",
                sort_order=SortOrder.desc,
                bucket="all",
                status=None,
                order_source=None,
                payment_status=None,
                created_today=False,
            ),
        )
        return [(row[0], row[1]) for row in result["items"]]

    async def list_orders_for_partner_paginated(
        self,
        partner_user_id: UUID,
        params: PartnerOrdersListParams,
    ) -> dict:
        from sqlalchemy import or_

        from app.core.pagination import apply_sort, build_paginated_response

        laundry_ids = await self._laundry_ids_for_partner(partner_user_id)
        stmt = (
            select(Order, User.full_name)
            .outerjoin(User, User.id == Order.user_id)
            .where(Order.laundry_id.in_(laundry_ids), Order.deleted_at.is_(None))
        )

        bucket = params.bucket or "all"
        if params.status:
            try:
                stmt = stmt.where(Order.status == OrderStatus(params.status))
            except ValueError:
                from app.core.exceptions import ValidationError

                raise ValidationError("Invalid status filter") from None
        elif bucket == "action":
            # Matches FE isOrderNeedsAction: confirmed online (not walk-in).
            stmt = stmt.where(
                Order.status == OrderStatus.confirmed,
                Order.order_source != OrderSource.walk_in,
            )
        elif bucket == "active":
            stmt = stmt.where(
                Order.status.notin_([OrderStatus.delivered, OrderStatus.cancelled]),
                or_(
                    Order.status != OrderStatus.confirmed,
                    Order.order_source == OrderSource.walk_in,
                ),
            )
        elif bucket == "done":
            stmt = stmt.where(Order.status.in_([OrderStatus.delivered, OrderStatus.cancelled]))

        if params.order_source:
            # Hub chip "Doorstep" = everything except counter walk-in.
            if params.order_source == "doorstep":
                stmt = stmt.where(Order.order_source != OrderSource.walk_in)
            else:
                try:
                    stmt = stmt.where(Order.order_source == OrderSource(params.order_source))
                except ValueError:
                    from app.core.exceptions import ValidationError

                    raise ValidationError("Invalid order_source filter") from None

        if params.payment_status:
            from app.models.enums import PaymentStatus

            if params.payment_status == "unpaid":
                stmt = stmt.where(
                    Order.payment_status.in_((PaymentStatus.pending, PaymentStatus.pending_cod)),
                )
            else:
                try:
                    stmt = stmt.where(Order.payment_status == PaymentStatus(params.payment_status))
                except ValueError:
                    from app.core.exceptions import ValidationError

                    raise ValidationError("Invalid payment_status filter") from None

        if params.created_today:
            from datetime import datetime
            from zoneinfo import ZoneInfo

            from sqlalchemy import Date, cast

            today = datetime.now(ZoneInfo("Asia/Kolkata")).date()
            stmt = stmt.where(cast(Order.created_at, Date) == today)

        if params.search:
            term = f"%{params.search}%"
            stmt = stmt.where(
                or_(
                    Order.tracking_code.ilike(term),
                    Order.customer_name.ilike(term),
                    Order.customer_phone.ilike(term),
                    User.full_name.ilike(term),
                    Order.token_code.ilike(term),
                ),
            )

        sort_map = {
            "created_at": Order.created_at,
            "pickup_at": Order.pickup_at,
            "delivery_at": Order.delivery_at,
            "tracking_code": Order.tracking_code,
            "status": Order.status,
            "total_inr": Order.total_inr,
            "customer_name": func.coalesce(User.full_name, Order.customer_name),
        }
        stmt = apply_sort(
            stmt,
            params.sort_by,
            params.sort_order,
            column_map=sort_map,
            default=Order.created_at,
        )

        count_stmt = select(func.count()).select_from(stmt.order_by(None).subquery())
        total = int(await self._session.scalar(count_stmt) or 0)
        result = await self._session.execute(
            stmt.options(selectinload(Order.items))
            .offset(params.offset)
            .limit(params.page_size),
        )
        rows: list[tuple[Order, str]] = []
        for order, user_name in result.all():
            display_name = user_name or order.customer_name or "Walk-in customer"
            rows.append((order, display_name))

        return build_paginated_response(
            items=rows,
            total_records=total,
            page=params.page,
            page_size=params.page_size,
        )
