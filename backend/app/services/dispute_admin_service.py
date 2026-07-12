"""Admin dispute datatable operations."""

from __future__ import annotations

import csv
import io
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, ValidationError
from app.models.complaint_internal_note import ComplaintInternalNote
from app.models.complaint_status_event import ComplaintStatusEvent
from app.models.enums import AuditAction, ComplaintStatus, ComplaintType, CustodyActorRole, DisputePriority, UserRole
from app.repositories.audit import AuditRepository
from app.repositories.complaint import ComplaintRepository
from app.repositories.user import UserRepository
from app.schemas.dispute_admin import (
    DISPUTE_STATUS_LABELS_EXT,
    DISPUTE_TYPE_LABELS_EXT,
    PRIORITY_LABELS,
)
from app.services.complaint_service import ComplaintService
from app.services.dispute_fraud_risk_service import DisputeFraudRiskService
from app.services.dispute_sla import compute_dispute_sla


def _default_priority(complaint_type: ComplaintType) -> DisputePriority:
    if complaint_type == ComplaintType.refund_request:
        return DisputePriority.high
    if complaint_type in (ComplaintType.payment_issue,):
        return DisputePriority.high
    return DisputePriority.medium


_ASSIGNABLE_ROLES = {
    UserRole.admin,
    UserRole.super_admin,
    UserRole.support_agent,
    UserRole.operations_manager,
}


class DisputeAdminService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._complaints = ComplaintRepository(session)
        self._users = UserRepository(session)
        self._core = ComplaintService(session)
        self._audit = AuditRepository(session)

    async def _assert_assignable(self, user_id: UUID | None) -> None:
        if user_id is None:
            return
        user = await self._users.get_by_id(user_id)
        if not user or user.role not in _ASSIGNABLE_ROLES:
            raise ValidationError("User cannot be assigned to disputes")

    async def metrics(self, *, current_user_id: UUID | None = None) -> dict:
        await self.auto_escalate_overdue()
        return await self._complaints.admin_metrics(current_user_id=current_user_id)

    async def auto_escalate_overdue(self) -> int:
        candidates = await self._complaints.list_auto_escalation_candidates()
        escalated = 0
        for row in candidates:
            row.status = ComplaintStatus.escalated
            row.priority = DisputePriority.critical
            await self._complaints.save(row)
            await self._complaints.add_status_event(
                ComplaintStatusEvent(
                    complaint_id=row.id,
                    status=ComplaintStatus.escalated,
                    actor_user_id=None,
                    actor_role=CustodyActorRole.admin,
                    note="Auto-escalated: SLA breached",
                ),
            )
            await self._audit.log(
                action=AuditAction.dispute_escalated,
                actor_user_id=None,
                resource_type="complaint",
                resource_id=str(row.id),
                metadata={
                    "auto": True,
                    "reason": "sla_breached",
                    "priority": row.priority.value,
                },
            )
            escalated += 1
        return escalated

    async def list_assignees(self) -> list[dict]:
        return await self._complaints.list_assignees()

    async def datatable(
        self,
        *,
        q: str | None = None,
        status: str | None = None,
        priority: str | None = None,
        complaint_type: str | None = None,
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
    ) -> dict:
        status_enum = ComplaintStatus(status) if status else None
        priority_enum = DisputePriority(priority) if priority else None
        type_enum = ComplaintType(complaint_type) if complaint_type else None

        await self.auto_escalate_overdue()

        from app.services.platform_config_service import PlatformConfigService

        sla_map = await PlatformConfigService(self._session).get_dispute_sla_hours()

        rows, total = await self._complaints.admin_search(
            q=q,
            status=status_enum,
            priority=priority_enum,
            complaint_type=type_enum,
            laundry_id=laundry_id,
            partner_id=partner_id,
            customer_id=customer_id,
            assigned_to=assigned_to,
            unassigned_only=unassigned_only,
            sla_status=sla_status,
            resolution_status=resolution_status,
            date_from=date_from,
            date_to=date_to,
            page=page,
            page_size=page_size,
            sort_by=sort_by,
            sort_dir=sort_dir,
        )

        items = []
        for row in rows:
            c = row["complaint"]
            sla = compute_dispute_sla(
                created_at=c.created_at,
                priority=c.priority,
                status=c.status,
                resolved_at=c.resolved_at,
                sla_map=sla_map,
            )
            item = {
                    "id": c.id,
                    "order_id": row["order_id"],
                    "tracking_code": row["tracking_code"],
                    "customer_id": c.user_id,
                    "customer_name": row["customer_name"],
                    "customer_email": row["customer_email"],
                    "customer_phone": row["customer_phone"],
                    "laundry_id": row["laundry_id"],
                    "laundry_name": row["laundry_name"],
                    "laundry_city": row["laundry_city"],
                    "partner_name": row["partner_name"],
                    "complaint_type": c.complaint_type,
                    "type_label": DISPUTE_TYPE_LABELS_EXT.get(c.complaint_type.value, c.complaint_type.value),
                    "priority": c.priority,
                    "priority_label": PRIORITY_LABELS.get(c.priority.value, c.priority.value),
                    "status": c.status,
                    "status_label": DISPUTE_STATUS_LABELS_EXT.get(c.status.value, c.status.value),
                    "description": c.description,
                    "created_at": c.created_at,
                    "updated_at": c.updated_at,
                    "assigned_to_user_id": c.assigned_to_user_id,
                    "assigned_to_name": row["assigned_to_name"],
                    "assigned_to_email": row.get("assigned_to_email"),
                    "assigned_to_role": row.get("assigned_to_role"),
                    "assigned_at": c.assigned_at,
                    "photo_count": row["photo_count"],
                    "resolved_at": c.resolved_at,
                }
            item.update(sla.as_dict())
            items.append(item)

        total_pages = max(1, (total + page_size - 1) // page_size)
        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }

    async def detail(self, complaint_id: UUID) -> dict:
        row = await self._complaints.get_by_id(complaint_id)
        if not row:
            raise NotFoundError("Dispute not found")
        base = await self._core.get_for_admin(complaint_id)
        data = base.model_dump()
        customer = await self._users.get_by_id(row.user_id)
        assignee_name = None
        if row.assigned_to_user_id:
            assignee = await self._users.get_by_id(row.assigned_to_user_id)
            assignee_name = assignee.full_name if assignee else None

        laundry_name = None
        partner_name = None
        if row.order_id:
            from app.repositories.order import OrderRepository
            from app.repositories.laundry import LaundryRepository

            order = await OrderRepository(self._session).get_by_id(row.order_id)
            if order:
                laundry = await LaundryRepository(self._session).get_by_id(order.laundry_id)
                if laundry:
                    laundry_name = laundry.name
                    owner = await self._users.get_by_id(laundry.owner_user_id)
                    partner_name = owner.full_name if owner else None

        notes = await self._complaints.list_internal_notes(complaint_id)
        author_ids = {n.author_user_id for n in notes if n.author_user_id}
        author_names: dict[UUID, str] = {}
        for uid in author_ids:
            u = await self._users.get_by_id(uid)
            if u:
                author_names[uid] = u.full_name or u.email or "Admin"

        from app.services.platform_config_service import PlatformConfigService

        sla_map = await PlatformConfigService(self._session).get_dispute_sla_hours()
        sla = compute_dispute_sla(
            created_at=row.created_at,
            priority=row.priority,
            status=row.status,
            resolved_at=row.resolved_at,
            sla_map=sla_map,
        )
        fraud_risk = await DisputeFraudRiskService(self._session).build_for_complaint(row)
        data.update(
            {
                "priority": row.priority,
                "priority_label": PRIORITY_LABELS.get(row.priority.value, row.priority.value),
                "assigned_to_user_id": row.assigned_to_user_id,
                "assigned_to_name": assignee_name,
                "assigned_at": row.assigned_at,
                "updated_at": row.updated_at,
                "resolved_at": row.resolved_at,
                "customer_email": customer.email if customer else None,
                "customer_phone": customer.phone if customer else None,
                "laundry_name": laundry_name,
                "partner_name": partner_name,
                "fraud_risk": fraud_risk,
                **sla.as_dict(),
                "internal_notes": [
                    {
                        "id": n.id,
                        "complaint_id": n.complaint_id,
                        "author_user_id": n.author_user_id,
                        "author_name": author_names.get(n.author_user_id) if n.author_user_id else None,
                        "body": n.body,
                        "is_edited": n.is_edited,
                        "created_at": n.created_at,
                        "updated_at": n.updated_at,
                    }
                    for n in notes
                ],
            },
        )
        return data

    async def assign(
        self,
        admin_id: UUID,
        complaint_id: UUID,
        *,
        assigned_to_user_id: UUID | None,
    ) -> dict:
        row = await self._complaints.get_by_id(complaint_id)
        if not row:
            raise NotFoundError("Dispute not found")
        await self._assert_assignable(assigned_to_user_id)
        old = row.assigned_to_user_id
        row.assigned_to_user_id = assigned_to_user_id
        row.assigned_at = datetime.now(UTC) if assigned_to_user_id else None
        await self._complaints.save(row)

        assignee_name = None
        if assigned_to_user_id:
            assignee = await self._users.get_by_id(assigned_to_user_id)
            assignee_name = assignee.full_name if assignee else None

        await self._complaints.add_status_event(
            ComplaintStatusEvent(
                complaint_id=row.id,
                status=row.status,
                actor_user_id=admin_id,
                actor_role=CustodyActorRole.admin,
                note=(
                    f"Assigned to {assignee_name}"
                    if assigned_to_user_id and assignee_name
                    else "Unassigned"
                ),
            ),
        )
        await self._audit.log(
            action=AuditAction.dispute_assigned,
            actor_user_id=admin_id,
            resource_type="complaint",
            resource_id=str(complaint_id),
            metadata={"from": str(old) if old else None, "to": str(assigned_to_user_id) if assigned_to_user_id else None},
        )
        return await self.detail(complaint_id)

    async def update_priority(
        self,
        admin_id: UUID,
        complaint_id: UUID,
        *,
        priority: DisputePriority,
    ) -> dict:
        row = await self._complaints.get_by_id(complaint_id)
        if not row:
            raise NotFoundError("Dispute not found")
        row.priority = priority
        if priority == DisputePriority.critical and row.status not in (
            ComplaintStatus.resolved,
            ComplaintStatus.rejected,
            ComplaintStatus.closed,
        ):
            row.status = ComplaintStatus.escalated
        await self._complaints.save(row)
        return await self.detail(complaint_id)

    async def add_note(
        self,
        admin_id: UUID,
        complaint_id: UUID,
        *,
        body: str,
    ) -> dict:
        row = await self._complaints.get_by_id(complaint_id)
        if not row:
            raise NotFoundError("Dispute not found")
        note = ComplaintInternalNote(
            complaint_id=complaint_id,
            author_user_id=admin_id,
            body=body.strip(),
        )
        await self._complaints.save_internal_note(note)
        await self._audit.log(
            action=AuditAction.dispute_note_added,
            actor_user_id=admin_id,
            resource_type="complaint",
            resource_id=str(complaint_id),
            metadata={"note_id": str(note.id)},
        )
        return await self.detail(complaint_id)

    async def edit_note(
        self,
        admin_id: UUID,
        note_id: UUID,
        *,
        body: str,
    ) -> dict:
        note = await self._complaints.get_internal_note(note_id)
        if not note:
            raise NotFoundError("Note not found")
        note.body = body.strip()
        note.is_edited = True
        await self._complaints.save_internal_note(note)
        await self._audit.log(
            action=AuditAction.dispute_note_added,
            actor_user_id=admin_id,
            resource_type="complaint",
            resource_id=str(note.complaint_id),
            metadata={"note_id": str(note.id), "edited": True},
        )
        return await self.detail(note.complaint_id)

    async def bulk_action(
        self,
        admin_id: UUID,
        *,
        complaint_ids: list[UUID],
        action: str,
        assigned_to_user_id: UUID | None = None,
        status: ComplaintStatus | None = None,
        priority: DisputePriority | None = None,
        note: str | None = None,
    ) -> dict:
        rows = await self._complaints.get_many_by_ids(complaint_ids)
        if len(rows) != len(complaint_ids):
            raise NotFoundError("One or more disputes not found")
        if action == "assign":
            await self._assert_assignable(assigned_to_user_id)

        updated = 0
        for row in rows:
            if action == "assign":
                old = row.assigned_to_user_id
                row.assigned_to_user_id = assigned_to_user_id
                row.assigned_at = datetime.now(UTC) if assigned_to_user_id else None
                assignee_name = None
                if assigned_to_user_id:
                    assignee = await self._users.get_by_id(assigned_to_user_id)
                    assignee_name = assignee.full_name if assignee else None
                await self._complaints.add_status_event(
                    ComplaintStatusEvent(
                        complaint_id=row.id,
                        status=row.status,
                        actor_user_id=admin_id,
                        actor_role=CustodyActorRole.admin,
                        note=(
                            f"Bulk assigned to {assignee_name}"
                            if assigned_to_user_id and assignee_name
                            else "Bulk unassigned"
                        ),
                    ),
                )
                await self._audit.log(
                    action=AuditAction.dispute_assigned,
                    actor_user_id=admin_id,
                    resource_type="complaint",
                    resource_id=str(row.id),
                    metadata={
                        "from": str(old) if old else None,
                        "to": str(assigned_to_user_id) if assigned_to_user_id else None,
                        "bulk": True,
                    },
                )
            elif action == "status" and status:
                row.status = status
                if status in (ComplaintStatus.resolved, ComplaintStatus.rejected, ComplaintStatus.closed):
                    row.resolved_at = datetime.now(UTC)
                await self._complaints.add_status_event(
                    ComplaintStatusEvent(
                        complaint_id=row.id,
                        status=status,
                        actor_user_id=admin_id,
                        actor_role=CustodyActorRole.admin,
                        note=note,
                    ),
                )
            elif action == "escalate":
                row.status = ComplaintStatus.escalated
                row.priority = DisputePriority.critical
                await self._complaints.add_status_event(
                    ComplaintStatusEvent(
                        complaint_id=row.id,
                        status=ComplaintStatus.escalated,
                        actor_user_id=admin_id,
                        actor_role=CustodyActorRole.admin,
                        note=note or "Bulk escalated",
                    ),
                )
                await self._audit.log(
                    action=AuditAction.dispute_escalated,
                    actor_user_id=admin_id,
                    resource_type="complaint",
                    resource_id=str(row.id),
                    metadata={"bulk": True, "auto": False},
                )
            elif action == "close":
                row.status = ComplaintStatus.closed
                row.resolved_at = datetime.now(UTC)
                await self._complaints.add_status_event(
                    ComplaintStatusEvent(
                        complaint_id=row.id,
                        status=ComplaintStatus.closed,
                        actor_user_id=admin_id,
                        actor_role=CustodyActorRole.admin,
                        note=note or "Bulk closed",
                    ),
                )
            elif action == "note" and note:
                await self._complaints.save_internal_note(
                    ComplaintInternalNote(
                        complaint_id=row.id,
                        author_user_id=admin_id,
                        body=note.strip(),
                    ),
                )
            if priority:
                row.priority = priority
            await self._complaints.save(row)
            updated += 1

        await self._audit.log(
            action=AuditAction.dispute_bulk_action,
            actor_user_id=admin_id,
            resource_type="complaint",
            resource_id=",".join(str(i) for i in complaint_ids[:5]),
            metadata={"action": action, "count": updated},
        )
        return {"updated": updated}

    async def export_csv(self, **filters) -> str:
        data = await self.datatable(page=1, page_size=10_000, **filters)
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(
            [
                "Dispute ID",
                "Order",
                "Customer",
                "Laundry",
                "Type",
                "Priority",
                "Status",
                "Assigned To",
                "Created",
                "Updated",
            ],
        )
        for row in data["items"]:
            writer.writerow(
                [
                    str(row["id"]),
                    row["tracking_code"] or "",
                    row["customer_name"],
                    row["laundry_name"] or "",
                    row["type_label"],
                    row["priority_label"],
                    row["status_label"],
                    row["assigned_to_name"] or "",
                    row["created_at"].isoformat(),
                    row["updated_at"].isoformat(),
                ],
            )
        return buf.getvalue()

    @staticmethod
    def default_priority_for_type(complaint_type: ComplaintType) -> DisputePriority:
        return _default_priority(complaint_type)
