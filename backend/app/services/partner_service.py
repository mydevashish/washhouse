"""Partner inventory, staff, and analytics."""

from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundError
from app.models.enums import OrderSource, OrderStatus
from app.models.order import Order, OrderInventory
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

            from sqlalchemy import cast, Date

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
