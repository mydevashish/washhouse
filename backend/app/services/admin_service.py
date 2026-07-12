"""Admin operations: onboard partners and laundries."""

from __future__ import annotations

import re
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy import cast, func, or_, select, Date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.types import String

from app.api.admin_list_params import AdminAuditListParams, AdminOrderListParams, AdminUserListParams
from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.core.pagination import apply_sort, build_paginated_response
from app.core.security import hash_password
from app.models.enums import LaundryStatus, OrderStatus, UserRole
from app.models.laundry import Laundry, LaundryService as LaundryServiceModel
from app.models.order import Order
from app.models.user import User
from app.models.complaint import Complaint
from app.models.enums import ComplaintStatus
from app.repositories.audit import AuditRepository
from app.repositories.laundry import LaundryRepository
from app.repositories.platform import PlatformRepository
from app.repositories.user import UserRepository
from app.schemas.admin import AdminCreateLaundryRequest


class AdminService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._users = UserRepository(session)
        self._laundries = LaundryRepository(session)

    async def create_laundry_with_partner(self, payload: AdminCreateLaundryRequest) -> dict:
        email = payload.owner_email.lower()
        owner = await self._users.get_by_email(email)

        if owner:
            if await self._laundries.get_by_owner(owner.id):
                raise ConflictError("This partner already has a laundry")
            owner.role = UserRole.partner
            owner.full_name = payload.owner_full_name
            if payload.owner_password:
                owner.password_hash = hash_password(payload.owner_password)
            await self._users.update(owner)
        else:
            if not payload.owner_password:
                raise ValidationError("Password required when creating a new partner account")
            owner = await self._users.create(
                email=email,
                phone=None,
                password_hash=hash_password(payload.owner_password),
                full_name=payload.owner_full_name,
                role=UserRole.partner,
                is_phone_verified=False,
            )
            owner.is_email_verified = True

        slug = re.sub(r"[^a-z0-9]+", "-", payload.name.lower()).strip("-")[:200]
        status = LaundryStatus.approved if payload.auto_approve else LaundryStatus.pending_approval
        laundry = Laundry(
            owner_user_id=owner.id,
            name=payload.name,
            slug=f"{slug}-{str(owner.id)[:8]}",
            city=payload.city,
            address_line=payload.address_line,
            description=payload.description,
            status=status,
            is_verified=payload.auto_approve,
        )
        await self._laundries.create(laundry)

        for svc in payload.services:
            self._session.add(
                LaundryServiceModel(
                    laundry_id=laundry.id,
                    name=svc.name,
                    category=svc.category,
                    unit=svc.unit,
                    price_inr=svc.price_inr,
                    is_active=True,
                ),
            )
        await self._session.flush()

        return {
            "laundry_id": str(laundry.id),
            "owner_user_id": str(owner.id),
            "owner_email": email,
            "status": laundry.status.value,
            "services_count": len(payload.services),
        }

    async def list_all_laundries(self) -> list[dict]:
        from sqlalchemy import select

        from app.models.laundry import Laundry

        result = await self._session.execute(
            select(Laundry).where(Laundry.deleted_at.is_(None)).order_by(Laundry.created_at.desc()),
        )
        rows = list(result.scalars().all())
        return [
            {
                "id": str(r.id),
                "name": r.name,
                "city": r.city,
                "status": r.status.value,
                "is_verified": r.is_verified,
            }
            for r in rows
        ]

    async def _default_commission(self) -> Decimal:
        return await PlatformRepository(self._session).get_default_commission()

    async def dashboard_stats(self) -> dict:
        orders_total = await self._session.scalar(
            select(func.count()).select_from(Order).where(Order.deleted_at.is_(None)),
        )
        users_total = await self._session.scalar(
            select(func.count()).select_from(User).where(User.deleted_at.is_(None)),
        )
        customers_total = await self._session.scalar(
            select(func.count()).select_from(User).where(
                User.deleted_at.is_(None),
                User.role == UserRole.customer,
            ),
        )
        today_start = datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0)
        orders_today = await self._session.scalar(
            select(func.count())
            .select_from(Order)
            .where(Order.deleted_at.is_(None), Order.created_at >= today_start),
        )
        complaints_open = await self._session.scalar(
            select(func.count())
            .select_from(Complaint)
            .where(
                Complaint.status.in_(
                    (ComplaintStatus.open, ComplaintStatus.investigating, ComplaintStatus.escalated),
                ),
            ),
        )
        laundries_approved = await self._session.scalar(
            select(func.count())
            .select_from(Laundry)
            .where(Laundry.status == LaundryStatus.approved, Laundry.deleted_at.is_(None)),
        )
        laundries_pending = await self._session.scalar(
            select(func.count())
            .select_from(Laundry)
            .where(
                Laundry.status == LaundryStatus.pending_approval,
                Laundry.deleted_at.is_(None),
            ),
        )
        in_progress_statuses = (
            OrderStatus.confirmed,
            OrderStatus.pickup_assigned,
            OrderStatus.picked_up,
            OrderStatus.washing,
            OrderStatus.ironing,
            OrderStatus.ready,
            OrderStatus.out_for_delivery,
        )
        orders_in_progress = await self._session.scalar(
            select(func.count())
            .select_from(Order)
            .where(Order.deleted_at.is_(None), Order.status.in_(in_progress_statuses)),
        )
        revenue_result = await self._session.execute(
            select(func.coalesce(func.sum(Order.total_inr), 0)).where(
                Order.deleted_at.is_(None),
                Order.status == OrderStatus.delivered,
            ),
        )
        revenue_total = Decimal(str(revenue_result.scalar() or 0))
        month_start = datetime.now(UTC).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_result = await self._session.execute(
            select(func.coalesce(func.sum(Order.total_inr), 0)).where(
                Order.deleted_at.is_(None),
                Order.status == OrderStatus.delivered,
                Order.created_at >= month_start,
            ),
        )
        revenue_month = Decimal(str(month_result.scalar() or 0))
        default_comm = await self._default_commission()
        commission_month = (revenue_month * default_comm / Decimal("100")).quantize(Decimal("0.01"))
        return {
            "orders_total": int(orders_total or 0),
            "users_total": int(users_total or 0),
            "customers_total": int(customers_total or 0),
            "laundries_approved": int(laundries_approved or 0),
            "laundries_pending": int(laundries_pending or 0),
            "orders_in_progress": int(orders_in_progress or 0),
            "orders_today": int(orders_today or 0),
            "complaints_open": int(complaints_open or 0),
            "revenue_total_inr": str(revenue_total.quantize(Decimal("0.01"))),
            "revenue_month_inr": str(revenue_month.quantize(Decimal("0.01"))),
            "commission_month_inr": str(commission_month),
        }

    async def analytics(self, *, days: int = 14) -> dict:
        days = max(7, min(days, 30))
        start = datetime.now(UTC) - timedelta(days=days - 1)
        start = start.replace(hour=0, minute=0, second=0, microsecond=0)

        order_rows = await self._session.execute(
            select(
                cast(Order.created_at, Date).label("day"),
                func.count(Order.id),
                func.coalesce(func.sum(Order.total_inr), 0),
            )
            .where(Order.deleted_at.is_(None), Order.created_at >= start)
            .group_by(cast(Order.created_at, Date))
            .order_by(cast(Order.created_at, Date)),
        )
        orders_by_day = {
            str(r[0]): (int(r[1]), Decimal(str(r[2]))) for r in order_rows.all()
        }

        customer_rows = await self._session.execute(
            select(cast(User.created_at, Date), func.count(User.id))
            .where(User.deleted_at.is_(None), User.role == UserRole.customer, User.created_at >= start)
            .group_by(cast(User.created_at, Date)),
        )
        customers_by_day = {str(r[0]): int(r[1]) for r in customer_rows.all()}

        laundry_rows = await self._session.execute(
            select(cast(Laundry.created_at, Date), func.count(Laundry.id))
            .where(Laundry.deleted_at.is_(None), Laundry.created_at >= start)
            .group_by(cast(Laundry.created_at, Date)),
        )
        laundries_by_day = {str(r[0]): int(r[1]) for r in laundry_rows.all()}

        trend: list[dict] = []
        for i in range(days):
            day = (start + timedelta(days=i)).date()
            key = str(day)
            o_count, o_rev = orders_by_day.get(key, (0, Decimal("0")))
            trend.append(
                {
                    "date": key,
                    "orders": o_count,
                    "revenue_inr": str(o_rev.quantize(Decimal("0.01"))),
                    "new_customers": customers_by_day.get(key, 0),
                    "new_laundries": laundries_by_day.get(key, 0),
                },
            )

        city_rows = await self._session.execute(
            select(Laundry.city, func.count(Laundry.id))
            .where(Laundry.deleted_at.is_(None), Laundry.status == LaundryStatus.approved)
            .group_by(Laundry.city)
            .order_by(func.count(Laundry.id).desc())
            .limit(6),
        )
        top_cities = [{"city": c, "count": int(n)} for c, n in city_rows.all()]

        top_laundry_rows = await self._session.execute(
            select(
                Laundry.name,
                Laundry.city,
                func.count(Order.id),
                func.coalesce(func.sum(Order.total_inr), 0),
            )
            .outerjoin(Order, Order.laundry_id == Laundry.id)
            .where(Laundry.deleted_at.is_(None), Order.deleted_at.is_(None))
            .group_by(Laundry.id, Laundry.name, Laundry.city)
            .order_by(func.coalesce(func.sum(Order.total_inr), 0).desc())
            .limit(5),
        )
        top_laundries = [
            {
                "name": name,
                "city": city,
                "orders": int(orders),
                "revenue_inr": str(Decimal(str(rev)).quantize(Decimal("0.01"))),
            }
            for name, city, orders, rev in top_laundry_rows.all()
        ]

        return {"orders_trend": trend, "top_cities": top_cities, "top_laundries": top_laundries}

    async def list_laundries_management(self) -> list[dict]:
        default_rate = await self._default_commission()
        result = await self._session.execute(
            select(Laundry, User.full_name, User.email)
            .join(User, User.id == Laundry.owner_user_id)
            .where(Laundry.deleted_at.is_(None))
            .order_by(Laundry.created_at.desc()),
        )
        rows: list[dict] = []
        for laundry, owner_name, owner_email in result.all():
            stats = await self._session.execute(
                select(
                    func.count(Order.id),
                    func.coalesce(func.sum(Order.total_inr), 0),
                ).where(
                    Order.laundry_id == laundry.id,
                    Order.deleted_at.is_(None),
                    Order.status == OrderStatus.delivered,
                ),
            )
            order_count, revenue = stats.one()
            effective = laundry.commission_rate if laundry.commission_rate is not None else default_rate
            rows.append(
                {
                    "id": laundry.id,
                    "name": laundry.name,
                    "owner_name": owner_name,
                    "owner_email": owner_email,
                    "city": laundry.city,
                    "status": laundry.status.value,
                    "global_commission_rate": str(default_rate),
                    "custom_commission_rate": str(laundry.commission_rate)
                    if laundry.commission_rate is not None
                    else None,
                    "effective_commission_rate": str(effective),
                    "orders_count": int(order_count or 0),
                    "revenue_inr": str(Decimal(str(revenue or 0)).quantize(Decimal("0.01"))),
                    "rating": str(laundry.avg_rating),
                    "review_count": laundry.review_count,
                    "created_at": laundry.created_at,
                },
            )
        return rows

    async def list_audit_logs(
        self,
        *,
        limit: int = 100,
        resource_type: str | None = None,
        resource_id: str | None = None,
    ) -> list[dict]:
        return await AuditRepository(self._session).list_logs(
            limit=limit,
            resource_type=resource_type,
            resource_id=resource_id,
        )

    async def list_audit_logs_paginated(self, params: AdminAuditListParams) -> dict:
        rows, total = await AuditRepository(self._session).list_logs_paginated(
            page=params.page,
            page_size=params.page_size,
            sort_by=params.sort_by,
            sort_order=params.sort_order.value if hasattr(params.sort_order, "value") else params.sort_order,
            action=params.action,
            resource_type=params.resource_type,
            resource_id=params.resource_id,
            since=params.created_from,
            until=params.created_to,
            search=params.search,
        )
        return build_paginated_response(
            items=rows,
            total_records=total,
            page=params.page,
            page_size=params.page_size,
        )

    async def list_pending_laundries(self) -> list[dict]:
        result = await self._session.execute(
            select(Laundry, User.email)
            .join(User, User.id == Laundry.owner_user_id)
            .where(
                Laundry.status == LaundryStatus.pending_approval,
                Laundry.deleted_at.is_(None),
            )
            .order_by(Laundry.created_at.asc()),
        )
        return [
            {
                "id": laundry.id,
                "name": laundry.name,
                "city": laundry.city,
                "address_line": laundry.address_line,
                "owner_email": email,
                "created_at": laundry.created_at,
            }
            for laundry, email in result.all()
        ]

    async def list_orders(self, *, limit: int = 100) -> list[dict]:
        result = await self._session.execute(
            select(Order, Laundry.name, User.full_name)
            .join(Laundry, Laundry.id == Order.laundry_id)
            .join(User, User.id == Order.user_id)
            .where(Order.deleted_at.is_(None))
            .order_by(Order.created_at.desc())
            .limit(limit),
        )
        return [
            {
                "id": order.id,
                "tracking_code": order.tracking_code,
                "status": order.status,
                "total_inr": order.total_inr,
                "payment_status": order.payment_status.value,
                "created_at": order.created_at,
                "laundry_name": laundry_name,
                "customer_name": customer_name,
            }
            for order, laundry_name, customer_name in result.all()
        ]

    async def list_orders_paginated(self, params: AdminOrderListParams) -> dict:
        stmt = (
            select(Order, Laundry.name, User.full_name)
            .join(Laundry, Laundry.id == Order.laundry_id)
            .join(User, User.id == Order.user_id)
            .where(Order.deleted_at.is_(None))
        )
        if params.status:
            stmt = stmt.where(Order.status == OrderStatus(params.status))
        if params.search:
            term = f"%{params.search}%"
            stmt = stmt.where(
                or_(
                    Order.tracking_code.ilike(term),
                    User.full_name.ilike(term),
                    Laundry.name.ilike(term),
                ),
            )
        sort_map = {
            "created_at": Order.created_at,
            "tracking_code": Order.tracking_code,
            "status": Order.status,
            "total_inr": Order.total_inr,
            "customer_name": User.full_name,
            "laundry_name": Laundry.name,
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
            stmt.offset(params.offset).limit(params.page_size),
        )
        items = [
            {
                "id": order.id,
                "tracking_code": order.tracking_code,
                "status": order.status,
                "total_inr": order.total_inr,
                "payment_status": order.payment_status.value,
                "created_at": order.created_at,
                "laundry_name": laundry_name,
                "customer_name": customer_name,
            }
            for order, laundry_name, customer_name in result.all()
        ]
        return build_paginated_response(
            items=items,
            total_records=total,
            page=params.page,
            page_size=params.page_size,
        )

    async def list_users(self, *, limit: int = 200) -> list[dict]:
        result = await self._session.execute(
            select(User)
            .where(User.deleted_at.is_(None))
            .order_by(User.created_at.desc())
            .limit(limit),
        )
        return [
            {
                "id": u.id,
                "email": u.email,
                "full_name": u.full_name,
                "role": u.role,
                "created_at": u.created_at,
                "is_email_verified": u.is_email_verified,
            }
            for u in result.scalars().all()
        ]

    async def list_users_paginated(self, params: AdminUserListParams) -> dict:
        stmt = select(User).where(User.deleted_at.is_(None))
        if params.role:
            stmt = stmt.where(User.role == UserRole(params.role))
        if params.search:
            term = f"%{params.search}%"
            stmt = stmt.where(
                or_(
                    User.full_name.ilike(term),
                    User.email.ilike(term),
                    cast(User.role, String).ilike(term),
                ),
            )
        sort_map = {
            "full_name": User.full_name,
            "email": User.email,
            "role": User.role,
            "created_at": User.created_at,
            "is_email_verified": User.is_email_verified,
        }
        stmt = apply_sort(
            stmt,
            params.sort_by,
            params.sort_order,
            column_map=sort_map,
            default=User.created_at,
        )
        count_stmt = select(func.count()).select_from(stmt.order_by(None).subquery())
        total = int(await self._session.scalar(count_stmt) or 0)
        result = await self._session.execute(
            stmt.offset(params.offset).limit(params.page_size),
        )
        items = [
            {
                "id": u.id,
                "email": u.email,
                "full_name": u.full_name,
                "role": u.role,
                "created_at": u.created_at,
                "is_email_verified": u.is_email_verified,
            }
            for u in result.scalars().all()
        ]
        return build_paginated_response(
            items=items,
            total_records=total,
            page=params.page,
            page_size=params.page_size,
        )

    async def reject_laundry(self, laundry_id: UUID) -> dict:
        laundry = await self._laundries.get_by_id(laundry_id)
        if not laundry:
            raise NotFoundError("Laundry not found")
        laundry.status = LaundryStatus.rejected
        laundry.is_verified = False
        await self._session.flush()
        return {"id": str(laundry.id), "status": laundry.status.value}
