"""Item inventory verification business logic."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.models.enums import (
    INVENTORY_ITEM_TYPES,
    CustodyActorRole,
    CustodyEventType,
    InventoryChangeRequestStatus,
    InventoryHistoryAction,
    InventoryItemType,
    InventoryVerificationStatus,
    OrderStatus,
)
from app.models.inventory_verification import (
    OrderInventoryChangeRequest,
    OrderInventoryHistory,
    OrderInventoryItem,
    OrderInventoryVerification,
)
from app.models.order import OrderStatusEvent
from app.repositories.inventory_verification import InventoryVerificationRepository
from app.repositories.laundry import LaundryRepository
from app.repositories.order import OrderRepository
from app.schemas.inventory_verification import (
    ITEM_LABELS,
    InventoryChangeRequestResponse,
    InventoryHistoryEntryResponse,
    InventoryItemLineResponse,
    InventoryVerificationResponse,
    empty_items_dict,
    items_input_to_dict,
)
from app.services.custody_event_service import CustodyEventService
from app.services.order_events import publish_order_status_update

RECORDABLE_STATUSES = {OrderStatus.confirmed, OrderStatus.pickup_assigned}
INVENTORY_CONFIRMED_NOTE = "Inventory confirmed by customer"
INVENTORY_RECORDED_NOTE = "Pickup inventory recorded"


class InventoryVerificationService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._orders = OrderRepository(session)
        self._laundries = LaundryRepository(session)
        self._repo = InventoryVerificationRepository(session)

    async def get_for_partner(self, partner_user_id: UUID, order_id: UUID) -> InventoryVerificationResponse | None:
        await self._require_partner_order(partner_user_id, order_id)
        verification = await self._repo.get_by_order(order_id)
        if not verification:
            return None
        return await self._to_response(verification)

    async def get_for_customer(self, user_id: UUID, order_id: UUID) -> InventoryVerificationResponse | None:
        order = await self._orders.get_by_id(order_id)
        if not order or order.user_id != user_id:
            raise NotFoundError("Order not found")
        verification = await self._repo.get_by_order(order_id)
        if not verification:
            return None
        return await self._to_response(verification)

    async def get_for_admin(self, order_id: UUID) -> InventoryVerificationResponse | None:
        order = await self._orders.get_by_id(order_id)
        if not order:
            raise NotFoundError("Order not found")
        verification = await self._repo.get_by_order(order_id)
        if not verification:
            return None
        return await self._to_response(verification)

    async def record_for_partner(
        self,
        partner_user_id: UUID,
        order_id: UUID,
        *,
        items: dict[str, int],
        note: str | None = None,
    ) -> InventoryVerificationResponse:
        order, _ = await self._require_partner_order(partner_user_id, order_id)
        if order.status not in RECORDABLE_STATUSES:
            raise ValidationError("Inventory can only be recorded before pickup is completed")

        total = sum(items.values())
        if total < 1:
            raise ValidationError("Record at least one item")

        existing = await self._repo.get_by_order(order_id)
        if existing and existing.status == InventoryVerificationStatus.locked:
            raise ConflictError("Inventory is locked — submit a change request for admin approval")
        if existing and existing.status == InventoryVerificationStatus.change_pending:
            raise ConflictError("A change request is pending admin review")

        now = datetime.now(UTC)
        if existing:
            self._apply_items(existing, items)
            existing.recorded_by_user_id = partner_user_id
            existing.recorded_at = now
            existing.status = InventoryVerificationStatus.pending_customer
            verification = await self._repo.save(existing)
        else:
            verification = OrderInventoryVerification(
                order_id=order.id,
                customer_id=order.user_id,
                laundry_id=order.laundry_id,
                status=InventoryVerificationStatus.pending_customer,
                recorded_by_user_id=partner_user_id,
                recorded_at=now,
            )
            self._apply_items(verification, items)
            verification = await self._repo.save(verification)

        await self._append_history(
            verification,
            action=InventoryHistoryAction.partner_recorded,
            items=items,
            actor_user_id=partner_user_id,
            note=note,
        )
        await self._maybe_add_timeline(order, INVENTORY_RECORDED_NOTE)
        await CustodyEventService(self._session).record(
            order.id,
            CustodyEventType.inventory_recorded,
            actor_user_id=partner_user_id,
            actor_role=CustodyActorRole.partner,
            metadata={"total_quantity": sum(items.values()), "items": items},
        )
        return await self._to_response(verification)

    async def confirm_for_customer(self, user_id: UUID, order_id: UUID) -> InventoryVerificationResponse:
        order = await self._orders.get_by_id(order_id)
        if not order or order.user_id != user_id:
            raise NotFoundError("Order not found")

        verification = await self._repo.get_by_order(order_id)
        if not verification:
            raise NotFoundError("Inventory not recorded yet")
        if verification.status == InventoryVerificationStatus.locked:
            raise ConflictError("Inventory is already confirmed and locked")
        if verification.status == InventoryVerificationStatus.change_pending:
            raise ConflictError("Inventory change is pending admin review")

        now = datetime.now(UTC)
        items = self._items_dict(verification)
        verification.status = InventoryVerificationStatus.locked
        verification.confirmed_by_user_id = user_id
        verification.confirmed_at = now
        verification.locked_at = now
        await self._repo.save(verification)

        await self._append_history(
            verification,
            action=InventoryHistoryAction.customer_confirmed,
            items=items,
            actor_user_id=user_id,
            note="Customer confirmed pickup inventory",
        )
        await self._append_history(
            verification,
            action=InventoryHistoryAction.locked,
            items=items,
            actor_user_id=user_id,
            note="Inventory locked after customer confirmation",
        )
        await self._maybe_add_timeline(order, INVENTORY_CONFIRMED_NOTE)
        await CustodyEventService(self._session).record(
            order.id,
            CustodyEventType.inventory_confirmed,
            actor_user_id=user_id,
            actor_role=CustodyActorRole.customer,
            metadata={"total_quantity": sum(items.values()), "items": items},
        )
        return await self._to_response(verification)

    async def request_change(
        self,
        partner_user_id: UUID,
        order_id: UUID,
        *,
        items: dict[str, int],
        reason: str,
    ) -> InventoryChangeRequestResponse:
        order, _ = await self._require_partner_order(partner_user_id, order_id)
        verification = await self._repo.get_by_order(order_id)
        if not verification:
            raise NotFoundError("Inventory not recorded yet")
        if verification.status != InventoryVerificationStatus.locked:
            raise ValidationError("Change requests apply only to locked inventory")

        pending = await self._repo.get_pending_change_for_order(order_id)
        if pending:
            raise ConflictError("A change request is already pending")

        total = sum(items.values())
        if total < 1:
            raise ValidationError("Proposed inventory must include at least one item")

        current = self._items_dict(verification)
        if current == items:
            raise ValidationError("Proposed inventory matches the current locked record")

        verification.status = InventoryVerificationStatus.change_pending
        await self._repo.save(verification)

        change = OrderInventoryChangeRequest(
            order_id=order.id,
            verification_id=verification.id,
            requested_by_user_id=partner_user_id,
            proposed_items={"items": items, "total": total},
            reason=reason,
        )
        saved = await self._repo.save_change_request(change)

        await self._append_history(
            verification,
            action=InventoryHistoryAction.change_requested,
            items=items,
            actor_user_id=partner_user_id,
            note=reason,
        )
        return self._change_to_response(saved)

    async def list_history(self, order_id: UUID) -> list[InventoryHistoryEntryResponse]:
        rows = await self._repo.list_history(order_id)
        return [InventoryHistoryEntryResponse.model_validate(r) for r in rows]

    async def list_pending_changes_admin(self) -> list[InventoryChangeRequestResponse]:
        rows = await self._repo.list_pending_change_requests()
        return [self._change_to_response(r) for r in rows]

    async def approve_change(self, admin_user_id: UUID, request_id: UUID, *, admin_notes: str | None) -> InventoryVerificationResponse:
        change = await self._repo.get_change_request(request_id)
        if not change or change.status != InventoryChangeRequestStatus.pending:
            raise NotFoundError("Change request not found")

        verification = await self._repo.get_by_order(change.order_id)
        if not verification:
            raise NotFoundError("Verification not found")

        proposed = change.proposed_items.get("items", {})
        self._apply_items(verification, proposed)
        now = datetime.now(UTC)
        verification.status = InventoryVerificationStatus.locked
        verification.recorded_at = now
        await self._repo.save(verification)

        change.status = InventoryChangeRequestStatus.approved
        change.reviewed_by_user_id = admin_user_id
        change.reviewed_at = now
        change.admin_notes = admin_notes
        await self._repo.save_change_request(change)

        await self._append_history(
            verification,
            action=InventoryHistoryAction.admin_approved,
            items=proposed,
            actor_user_id=admin_user_id,
            note=admin_notes or change.reason,
        )
        return await self._to_response(verification)

    async def reject_change(self, admin_user_id: UUID, request_id: UUID, *, admin_notes: str | None) -> InventoryChangeRequestResponse:
        change = await self._repo.get_change_request(request_id)
        if not change or change.status != InventoryChangeRequestStatus.pending:
            raise NotFoundError("Change request not found")

        verification = await self._repo.get_by_order(change.order_id)
        if verification:
            verification.status = InventoryVerificationStatus.locked
            await self._repo.save(verification)
            await self._append_history(
                verification,
                action=InventoryHistoryAction.admin_rejected,
                items=self._items_dict(verification),
                actor_user_id=admin_user_id,
                note=admin_notes or change.reason,
            )

        change.status = InventoryChangeRequestStatus.rejected
        change.reviewed_by_user_id = admin_user_id
        change.reviewed_at = datetime.now(UTC)
        change.admin_notes = admin_notes
        await self._repo.save_change_request(change)
        return self._change_to_response(change)

    async def has_recorded_inventory(self, order_id: UUID) -> bool:
        verification = await self._repo.get_by_order(order_id)
        return verification is not None and sum(self._items_dict(verification).values()) > 0

    async def _require_partner_order(self, partner_user_id: UUID, order_id: UUID):
        laundry = await self._laundries.get_by_owner(partner_user_id)
        if not laundry:
            raise NotFoundError("Partner laundry not found")
        order = await self._orders.get_by_id(order_id)
        if not order or order.laundry_id != laundry.id:
            raise NotFoundError("Order not found")
        return order, laundry

    def _apply_items(self, verification: OrderInventoryVerification, items: dict[str, int]) -> None:
        by_type = {line.item_type: line for line in verification.items}
        for item_type in INVENTORY_ITEM_TYPES:
            qty = int(items.get(item_type.value, 0))
            line = by_type.get(item_type)
            if line:
                line.quantity = qty
            else:
                verification.items.append(
                    OrderInventoryItem(verification_id=verification.id, item_type=item_type, quantity=qty),
                )

    def _items_dict(self, verification: OrderInventoryVerification) -> dict[str, int]:
        result = empty_items_dict()
        for line in verification.items:
            result[line.item_type.value] = line.quantity
        return result

    async def _append_history(
        self,
        verification: OrderInventoryVerification,
        *,
        action: InventoryHistoryAction,
        items: dict[str, int],
        actor_user_id: UUID,
        note: str | None,
    ) -> None:
        total = sum(items.values())
        await self._repo.add_history(
            OrderInventoryHistory(
                order_id=verification.order_id,
                verification_id=verification.id,
                action=action,
                items_snapshot={"items": items, "total": total},
                actor_user_id=actor_user_id,
                note=note,
            ),
        )

    async def _maybe_add_timeline(self, order, note: str) -> None:
        event = OrderStatusEvent(order_id=order.id, status=order.status, note=note)
        await self._orders.add_event(event)
        await publish_order_status_update(order, event)

    async def _to_response(self, verification: OrderInventoryVerification) -> InventoryVerificationResponse:
        items_map = self._items_dict(verification)
        lines = [
            InventoryItemLineResponse(
                item_type=item_type,
                label=ITEM_LABELS[item_type],
                quantity=items_map[item_type.value],
            )
            for item_type in INVENTORY_ITEM_TYPES
        ]
        pending = await self._repo.get_pending_change_for_order(verification.order_id)
        return InventoryVerificationResponse(
            id=verification.id,
            order_id=verification.order_id,
            customer_id=verification.customer_id,
            laundry_id=verification.laundry_id,
            status=verification.status,
            items=lines,
            total_quantity=sum(items_map.values()),
            recorded_by_user_id=verification.recorded_by_user_id,
            recorded_at=verification.recorded_at,
            confirmed_by_user_id=verification.confirmed_by_user_id,
            confirmed_at=verification.confirmed_at,
            locked_at=verification.locked_at,
            is_locked=verification.status == InventoryVerificationStatus.locked,
            pending_change_request_id=pending.id if pending else None,
        )

    @staticmethod
    def _change_to_response(row: OrderInventoryChangeRequest) -> InventoryChangeRequestResponse:
        return InventoryChangeRequestResponse(
            id=row.id,
            order_id=row.order_id,
            verification_id=row.verification_id,
            proposed_items=row.proposed_items,
            reason=row.reason,
            status=row.status,
            requested_by_user_id=row.requested_by_user_id,
            reviewed_by_user_id=row.reviewed_by_user_id,
            reviewed_at=row.reviewed_at,
            admin_notes=row.admin_notes,
            created_at=row.created_at,
        )
