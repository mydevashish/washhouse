"""Dispute management persistence."""

from __future__ import annotations

from datetime import datetime, timedelta
from uuid import UUID

from sqlalchemy import String, case, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.complaint import Complaint
from app.models.complaint_internal_note import ComplaintInternalNote
from app.models.complaint_photo import ComplaintPhoto
from app.models.complaint_status_event import ComplaintStatusEvent
from app.models.enums import ComplaintStatus, ComplaintType, DisputePriority
from app.models.laundry import Laundry
from app.models.order import Order
from app.models.user import User


def _sla_deadline_expr():
    return case(
        (Complaint.priority == DisputePriority.low, Complaint.created_at + timedelta(hours=72)),
        (Complaint.priority == DisputePriority.medium, Complaint.created_at + timedelta(hours=48)),
        (Complaint.priority == DisputePriority.high, Complaint.created_at + timedelta(hours=24)),
        else_=Complaint.created_at + timedelta(hours=4),
    )


def _sla_at_risk_expr():
    return case(
        (Complaint.priority == DisputePriority.low, Complaint.created_at + timedelta(hours=54)),
        (Complaint.priority == DisputePriority.medium, Complaint.created_at + timedelta(hours=36)),
        (Complaint.priority == DisputePriority.high, Complaint.created_at + timedelta(hours=18)),
        else_=Complaint.created_at + timedelta(hours=3),
    )


_ACTIVE_SLA_STATUSES = (
    ComplaintStatus.open,
    ComplaintStatus.investigating,
    ComplaintStatus.awaiting_customer,
    ComplaintStatus.awaiting_partner,
    ComplaintStatus.escalated,
)


class ComplaintRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def save(self, row: Complaint) -> Complaint:
        self._session.add(row)
        await self._session.flush()
        return row

    async def get_by_id(self, complaint_id: UUID) -> Complaint | None:
        result = await self._session.execute(
            select(Complaint).where(Complaint.id == complaint_id),
        )
        return result.scalar_one_or_none()

    async def get_by_id_with_photos(self, complaint_id: UUID) -> Complaint | None:
        result = await self._session.execute(
            select(Complaint)
            .where(Complaint.id == complaint_id)
            .options(selectinload(Complaint.photos)),  # type: ignore[arg-type]
        )
        return result.scalar_one_or_none()

    async def list_by_user(self, user_id: UUID, *, limit: int = 50) -> list[Complaint]:
        result = await self._session.execute(
            select(Complaint)
            .where(Complaint.user_id == user_id)
            .order_by(Complaint.created_at.desc())
            .limit(limit),
        )
        return list(result.scalars().all())

    async def list_all(self, *, limit: int = 100) -> list[Complaint]:
        result = await self._session.execute(
            select(Complaint).order_by(Complaint.created_at.desc()).limit(limit),
        )
        return list(result.scalars().all())

    async def add_photos(self, photos: list[ComplaintPhoto]) -> list[ComplaintPhoto]:
        for photo in photos:
            self._session.add(photo)
        await self._session.flush()
        return photos

    async def list_photos(self, complaint_id: UUID) -> list[ComplaintPhoto]:
        result = await self._session.execute(
            select(ComplaintPhoto)
            .where(ComplaintPhoto.complaint_id == complaint_id)
            .order_by(ComplaintPhoto.sort_index.asc()),
        )
        return list(result.scalars().all())

    async def get_photo(self, photo_id: UUID) -> ComplaintPhoto | None:
        result = await self._session.execute(
            select(ComplaintPhoto).where(ComplaintPhoto.id == photo_id),
        )
        return result.scalar_one_or_none()

    async def add_status_event(self, event: ComplaintStatusEvent) -> ComplaintStatusEvent:
        self._session.add(event)
        await self._session.flush()
        return event

    async def list_status_events(self, complaint_id: UUID) -> list[ComplaintStatusEvent]:
        result = await self._session.execute(
            select(ComplaintStatusEvent)
            .where(ComplaintStatusEvent.complaint_id == complaint_id)
            .order_by(ComplaintStatusEvent.created_at.asc()),
        )
        return list(result.scalars().all())

    async def admin_search(
        self,
        *,
        q: str | None = None,
        status: ComplaintStatus | None = None,
        priority: DisputePriority | None = None,
        complaint_type: ComplaintType | None = None,
        laundry_id: UUID | None = None,
        partner_id: UUID | None = None,
        customer_id: UUID | None = None,
        assigned_to: UUID | None = None,
        unassigned_only: bool = False,
        sla_status: str | None = None,
        resolution_status: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        page: int = 1,
        page_size: int = 25,
        sort_by: str = "created_at",
        sort_dir: str = "desc",
    ) -> tuple[list[dict], int]:
        photo_count = (
            select(func.count(ComplaintPhoto.id))
            .where(ComplaintPhoto.complaint_id == Complaint.id)
            .correlate(Complaint)
            .scalar_subquery()
        )

        stmt = (
            select(
                Complaint,
                User.full_name.label("customer_name"),
                User.email.label("customer_email"),
                User.phone.label("customer_phone"),
                Order.tracking_code,
                Order.id.label("order_uuid"),
                Laundry.id.label("laundry_id"),
                Laundry.name.label("laundry_name"),
                Laundry.city.label("laundry_city"),
                photo_count.label("photo_count"),
            )
            .join(User, User.id == Complaint.user_id)
            .outerjoin(Order, Order.id == Complaint.order_id)
            .outerjoin(Laundry, Laundry.id == Order.laundry_id)
        )

        if partner_id:
            stmt = stmt.where(Laundry.owner_user_id == partner_id)
        if laundry_id:
            stmt = stmt.where(Laundry.id == laundry_id)
        if customer_id:
            stmt = stmt.where(Complaint.user_id == customer_id)
        if status:
            stmt = stmt.where(Complaint.status == status)
        if priority:
            stmt = stmt.where(Complaint.priority == priority)
        if complaint_type:
            stmt = stmt.where(Complaint.complaint_type == complaint_type)
        if assigned_to:
            stmt = stmt.where(Complaint.assigned_to_user_id == assigned_to)
        if unassigned_only:
            stmt = stmt.where(Complaint.assigned_to_user_id.is_(None))
        if sla_status in ("on_track", "at_risk", "breached"):
            now = func.now()
            deadline = _sla_deadline_expr()
            at_risk = _sla_at_risk_expr()
            stmt = stmt.where(Complaint.status.in_(_ACTIVE_SLA_STATUSES))
            if sla_status == "breached":
                stmt = stmt.where(now >= deadline)
            elif sla_status == "at_risk":
                stmt = stmt.where(now >= at_risk, now < deadline)
            else:
                stmt = stmt.where(now < at_risk)
        if date_from:
            stmt = stmt.where(Complaint.created_at >= date_from)
        if date_to:
            stmt = stmt.where(Complaint.created_at <= date_to)

        if resolution_status == "open":
            stmt = stmt.where(
                Complaint.status.in_(
                    (
                        ComplaintStatus.open,
                        ComplaintStatus.investigating,
                        ComplaintStatus.awaiting_customer,
                        ComplaintStatus.awaiting_partner,
                        ComplaintStatus.escalated,
                    ),
                ),
            )
        elif resolution_status == "resolved":
            stmt = stmt.where(
                Complaint.status.in_(
                    (ComplaintStatus.resolved, ComplaintStatus.rejected, ComplaintStatus.closed),
                ),
            )

        if q:
            pattern = f"%{q.strip()}%"
            stmt = stmt.where(
                or_(
                    func.cast(Complaint.id, String).ilike(pattern),
                    Order.tracking_code.ilike(pattern),
                    User.full_name.ilike(pattern),
                    User.email.ilike(pattern),
                    User.phone.ilike(pattern),
                    Laundry.name.ilike(pattern),
                    Complaint.description.ilike(pattern),
                ),
            )

        sort_map = {
            "created_at": Complaint.created_at,
            "updated_at": Complaint.updated_at,
            "status": Complaint.status,
            "priority": Complaint.priority,
            "type": Complaint.complaint_type,
        }
        sort_col = sort_map.get(sort_by, Complaint.created_at)
        order = sort_col.desc() if sort_dir == "desc" else sort_col.asc()
        stmt = stmt.order_by(order)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = int(await self._session.scalar(count_stmt) or 0)

        offset = (max(page, 1) - 1) * page_size
        result = await self._session.execute(stmt.limit(page_size).offset(offset))
        rows_raw = result.all()

        assigned_ids = {r[0].assigned_to_user_id for r in rows_raw if r[0].assigned_to_user_id}
        assignee_names: dict[UUID, str] = {}
        assignee_emails: dict[UUID, str | None] = {}
        assignee_roles: dict[UUID, str] = {}
        if assigned_ids:
            assignees = await self._session.execute(
                select(User.id, User.full_name, User.email, User.role).where(User.id.in_(assigned_ids)),
            )
            for uid, name, email, role in assignees.all():
                assignee_names[uid] = name
                assignee_emails[uid] = email
                assignee_roles[uid] = role.value if hasattr(role, "value") else str(role)

        partner_names: dict[UUID, str] = {}
        laundry_ids = {r.laundry_id for r in rows_raw if r.laundry_id}
        if laundry_ids:
            partners = await self._session.execute(
                select(Laundry.id, User.full_name)
                .join(User, User.id == Laundry.owner_user_id)
                .where(Laundry.id.in_(laundry_ids)),
            )
            partner_names = {lid: name for lid, name in partners.all()}

        rows: list[dict] = []
        for complaint, customer_name, customer_email, customer_phone, tracking_code, order_uuid, laundry_id_val, laundry_name, laundry_city, photo_count_val in rows_raw:
            rows.append(
                {
                    "complaint": complaint,
                    "customer_name": customer_name,
                    "customer_email": customer_email,
                    "customer_phone": customer_phone,
                    "tracking_code": tracking_code,
                    "order_id": order_uuid,
                    "laundry_id": laundry_id_val,
                    "laundry_name": laundry_name,
                    "laundry_city": laundry_city,
                    "partner_name": partner_names.get(laundry_id_val) if laundry_id_val else None,
                    "photo_count": int(photo_count_val or 0),
                    "assigned_to_name": assignee_names.get(complaint.assigned_to_user_id)
                    if complaint.assigned_to_user_id
                    else None,
                    "assigned_to_email": assignee_emails.get(complaint.assigned_to_user_id)
                    if complaint.assigned_to_user_id
                    else None,
                    "assigned_to_role": assignee_roles.get(complaint.assigned_to_user_id)
                    if complaint.assigned_to_user_id
                    else None,
                    "assigned_at": complaint.assigned_at,
                },
            )
        return rows, total

    async def list_assignees(self) -> list[dict]:
        from app.models.enums import UserRole

        roles = (
            UserRole.admin,
            UserRole.super_admin,
            UserRole.support_agent,
            UserRole.operations_manager,
        )
        result = await self._session.execute(
            select(User.id, User.full_name, User.email, User.role)
            .where(User.deleted_at.is_(None), User.role.in_(roles))
            .order_by(User.full_name.asc()),
        )
        role_labels = {
            UserRole.admin.value: "Admin",
            UserRole.super_admin.value: "Admin",
            UserRole.support_agent.value: "Support Agent",
            UserRole.operations_manager.value: "Operations Manager",
        }
        return [
            {
                "id": uid,
                "full_name": name,
                "email": email,
                "role": role.value,
                "role_label": role_labels.get(role.value, role.value),
            }
            for uid, name, email, role in result.all()
        ]

    async def admin_metrics(self, *, current_user_id: UUID | None = None) -> dict:
        from datetime import UTC

        today_start = datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0)
        open_statuses = (
            ComplaintStatus.open,
            ComplaintStatus.investigating,
            ComplaintStatus.awaiting_customer,
            ComplaintStatus.awaiting_partner,
            ComplaintStatus.escalated,
        )
        open_count = await self._session.scalar(
            select(func.count()).select_from(Complaint).where(Complaint.status.in_(open_statuses)),
        )
        critical_count = await self._session.scalar(
            select(func.count())
            .select_from(Complaint)
            .where(Complaint.priority == DisputePriority.critical, Complaint.status.in_(open_statuses)),
        )
        resolved_today = await self._session.scalar(
            select(func.count())
            .select_from(Complaint)
            .where(
                Complaint.status.in_((ComplaintStatus.resolved, ComplaintStatus.closed)),
                Complaint.resolved_at >= today_start,
            ),
        )
        investigating = await self._session.scalar(
            select(func.count())
            .select_from(Complaint)
            .where(Complaint.status == ComplaintStatus.investigating),
        )
        unassigned = await self._session.scalar(
            select(func.count())
            .select_from(Complaint)
            .where(Complaint.assigned_to_user_id.is_(None), Complaint.status.in_(open_statuses)),
        )
        my_open = 0
        if current_user_id:
            my_open = int(
                await self._session.scalar(
                    select(func.count())
                    .select_from(Complaint)
                    .where(
                        Complaint.assigned_to_user_id == current_user_id,
                        Complaint.status.in_(open_statuses),
                    ),
                )
                or 0,
            )
        total_orders = await self._session.scalar(select(func.count()).select_from(Order))
        total_disputes = await self._session.scalar(select(func.count()).select_from(Complaint))
        from decimal import Decimal

        rate = (
            (Decimal(str(total_disputes or 0)) / Decimal(str(total_orders or 1)) * Decimal("100")).quantize(
                Decimal("0.01"),
            )
            if total_orders
            else Decimal("0")
        )

        avg_hours = await self._session.scalar(
            select(
                func.avg(
                    func.extract("epoch", Complaint.resolved_at - Complaint.created_at) / 3600.0,
                ),
            ).where(Complaint.resolved_at.isnot(None)),
        )

        now = func.now()
        deadline = _sla_deadline_expr()
        at_risk = _sla_at_risk_expr()
        active_sla = Complaint.status.in_(_ACTIVE_SLA_STATUSES)
        near_breach = await self._session.scalar(
            select(func.count())
            .select_from(Complaint)
            .where(active_sla, now >= at_risk, now < deadline),
        )
        breached = await self._session.scalar(
            select(func.count()).select_from(Complaint).where(active_sla, now >= deadline),
        )

        return {
            "open_disputes": int(open_count or 0),
            "critical_disputes": int(critical_count or 0),
            "resolved_today": int(resolved_today or 0),
            "pending_investigation": int(investigating or 0),
            "unassigned_disputes": int(unassigned or 0),
            "my_open_disputes": my_open,
            "near_sla_breach": int(near_breach or 0),
            "breached_sla": int(breached or 0),
            "dispute_rate_pct": str(rate),
            "avg_resolution_hours": str(round(float(avg_hours or 0), 1)),
        }

    async def list_auto_escalation_candidates(self) -> list[Complaint]:
        now = func.now()
        deadline = _sla_deadline_expr()
        auto_statuses = (
            ComplaintStatus.open,
            ComplaintStatus.investigating,
            ComplaintStatus.awaiting_customer,
            ComplaintStatus.awaiting_partner,
        )
        result = await self._session.execute(
            select(Complaint).where(Complaint.status.in_(auto_statuses), now >= deadline),
        )
        return list(result.scalars().all())

    async def list_internal_notes(self, complaint_id: UUID) -> list[ComplaintInternalNote]:
        result = await self._session.execute(
            select(ComplaintInternalNote)
            .where(ComplaintInternalNote.complaint_id == complaint_id)
            .order_by(ComplaintInternalNote.created_at.asc()),
        )
        return list(result.scalars().all())

    async def get_internal_note(self, note_id: UUID) -> ComplaintInternalNote | None:
        result = await self._session.execute(
            select(ComplaintInternalNote).where(ComplaintInternalNote.id == note_id),
        )
        return result.scalar_one_or_none()

    async def save_internal_note(self, note: ComplaintInternalNote) -> ComplaintInternalNote:
        self._session.add(note)
        await self._session.flush()
        return note

    async def get_many_by_ids(self, ids: list[UUID]) -> list[Complaint]:
        if not ids:
            return []
        result = await self._session.execute(select(Complaint).where(Complaint.id.in_(ids)))
        return list(result.scalars().all())
