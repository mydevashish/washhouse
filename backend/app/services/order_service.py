"""Customer order lifecycle and partner status updates."""

from __future__ import annotations

import secrets
from datetime import UTC, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import (
    ConflictError,
    LaundryNotApprovedError,
    NotFoundError,
    OrderInvalidTransitionError,
    ValidationError,
)
from app.models.enums import (
    CustodyActorRole,
    CustodyEventType,
    LaundryStatus,
    OrderSource,
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
)
from app.models.order import Order, OrderItem, OrderStatusEvent
from app.models.payment import Payment
from app.repositories.address import AddressRepository
from app.repositories.laundry import LaundryRepository
from app.repositories.order import OrderRepository
from app.repositories.partner_service_catalog import PartnerServiceCatalogRepository
from app.services.custody_event_service import CustodyEventService
from app.services.fraud_detection_service import FraudDetectionService
from app.services.inventory_verification_service import InventoryVerificationService
from app.services.notifications.order_status_whatsapp_notifier import OrderStatusWhatsAppNotifier
from app.services.order_events import publish_order_status_update
from app.services.payments.provider import get_payment_provider
from app.services.pickup_evidence_service import PickupEvidenceService
from app.services.platform_config_service import PlatformConfigService

DELIVERY_FEE_INR = Decimal("49")
GST_RATE_PERCENT = Decimal("18")

PARTNER_NEXT_STATUS: dict[OrderStatus, OrderStatus] = {
    OrderStatus.pickup_assigned: OrderStatus.picked_up,
    OrderStatus.picked_up: OrderStatus.washing,
    OrderStatus.washing: OrderStatus.ironing,
    OrderStatus.ironing: OrderStatus.ready,
    OrderStatus.ready: OrderStatus.out_for_delivery,
}

WALK_IN_NEXT_STATUS: dict[OrderStatus, OrderStatus] = {
    OrderStatus.confirmed: OrderStatus.washing,
    OrderStatus.washing: OrderStatus.ready,
    OrderStatus.ready: OrderStatus.delivered,
}

ACCEPT_NOTE = "Order accepted by partner"
REJECT_NOTE = "Order rejected by partner"
CONFIRMED_NOTE = "Order confirmed"
CUSTOMER_CANCEL_NOTE = "Cancelled by customer"
CUSTOMER_CANCELABLE_STATUSES = frozenset({OrderStatus.confirmed, OrderStatus.pickup_assigned})


class OrderService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._orders = OrderRepository(session)
        self._laundries = LaundryRepository(session)
        self._addresses = AddressRepository(session)
        self._catalog = PartnerServiceCatalogRepository(session)

    async def create_order(
        self,
        user_id: UUID,
        *,
        laundry_id: UUID,
        address_id: UUID,
        pickup_at: datetime,
        delivery_at: datetime,
        items: list[dict[str, Any]],
        notes: str | None = None,
    ) -> Order:
        if not settings.FEATURE_ONLINE_BOOKING:
            raise ValidationError("Online booking is not available yet")

        if not items:
            raise ValidationError("At least one service line is required")

        laundry = await self._laundries.get_by_id(laundry_id)
        if not laundry or laundry.status != LaundryStatus.approved:
            raise LaundryNotApprovedError("Laundry is not available for booking")

        address = await self._addresses.get_by_id(address_id, user_id)
        if not address:
            raise ValidationError("Address not found")

        pickup = self._ensure_aware(pickup_at)
        delivery = self._ensure_aware(delivery_at)
        if delivery <= pickup:
            raise ValidationError("Delivery time must be after pickup time")

        line_items: list[OrderItem] = []
        subtotal = Decimal("0")
        for raw in items:
            service_id = UUID(str(raw["service_id"]))
            quantity = int(raw["quantity"])
            if quantity < 1:
                raise ValidationError("Quantity must be at least 1")

            service = await self._catalog.get(service_id, laundry_id)
            if not service or not service.is_active or service.catalog_status != "active":
                raise ValidationError("One or more services are invalid or unavailable")

            line_total = (service.price_inr * quantity).quantize(Decimal("0.01"))
            subtotal += line_total
            line_items.append(
                OrderItem(
                    service_id=service.id,
                    service_name=service.name,
                    quantity=quantity,
                    unit_price_inr=service.price_inr,
                    line_total_inr=line_total,
                ),
            )

        delivery_fee = DELIVERY_FEE_INR
        taxable = subtotal + delivery_fee
        half_gst = (taxable * GST_RATE_PERCENT / Decimal("200")).quantize(Decimal("0.01"))
        cgst = half_gst
        sgst = half_gst
        total = (taxable + cgst + sgst).quantize(Decimal("0.01"))

        platform = PlatformConfigService(self._session)
        min_amount, max_amount = await platform.get_order_limits()
        if total < min_amount:
            raise ValidationError(f"Order total must be at least ₹{min_amount}")
        if total > max_amount:
            raise ValidationError(f"Order total cannot exceed ₹{max_amount}")

        commission_rate = await platform.resolve_commission_rate(laundry)
        tracking_code = await self._allocate_tracking_code()

        order = Order(
            user_id=user_id,
            laundry_id=laundry_id,
            address_id=address_id,
            status=OrderStatus.confirmed,
            tracking_code=tracking_code,
            pickup_at=pickup,
            delivery_at=delivery,
            notes=notes,
            subtotal_inr=subtotal,
            delivery_fee_inr=delivery_fee,
            gst_rate=GST_RATE_PERCENT,
            cgst_inr=cgst,
            sgst_inr=sgst,
            total_inr=total,
            commission_rate=commission_rate,
        )
        order = await self._orders.create(order)

        for item in line_items:
            item.order_id = order.id
            self._session.add(item)

        event = OrderStatusEvent(
            order_id=order.id,
            status=OrderStatus.confirmed,
            note=CONFIRMED_NOTE,
        )
        await self._orders.add_event(event)
        await CustodyEventService(self._session).record(
            order.id,
            CustodyEventType.order_confirmed,
            actor_user_id=user_id,
            actor_role=CustodyActorRole.customer,
            metadata={"tracking_code": tracking_code, "total_inr": str(total)},
        )
        await publish_order_status_update(order, event)
        await self._session.flush()
        return await self._orders.get_by_id(order.id) or order

    async def list_for_user(
        self,
        user_id: UUID,
        *,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Order]:
        return await self._orders.list_by_user(user_id, limit=limit, offset=offset)

    async def get_for_user(self, user_id: UUID, order_id: UUID) -> Order:
        order = await self._orders.get_by_id(order_id)
        if not order or order.user_id != user_id:
            raise NotFoundError("Order not found")
        return order

    async def list_events(self, user_id: UUID, order_id: UUID) -> list[OrderStatusEvent]:
        order = await self.get_for_user(user_id, order_id)
        return sorted(order.events, key=lambda e: e.created_at)

    async def accept_order(self, partner_user_id: UUID, order_id: UUID) -> Order:
        return await self.update_status_partner(
            partner_user_id,
            order_id,
            OrderStatus.pickup_assigned,
            note=ACCEPT_NOTE,
        )

    async def reject_order(self, partner_user_id: UUID, order_id: UUID) -> Order:
        return await self.update_status_partner(
            partner_user_id,
            order_id,
            OrderStatus.cancelled,
            note=REJECT_NOTE,
        )

    async def cancel_order_customer(
        self,
        user_id: UUID,
        order_id: UUID,
        *,
        reason: str | None = None,
    ) -> Order:
        """Customer cancel before pickup — only confirmed / pickup_assigned.

        Reconciles payment: unpaid/COD voided locally; paid Razorpay refunded.
        """
        order = await self.get_for_user(user_id, order_id)

        if order.status == OrderStatus.cancelled:
            return order

        if order.status not in CUSTOMER_CANCELABLE_STATUSES:
            raise OrderInvalidTransitionError(
                "Order can only be cancelled before pickup",
            )

        await self._reconcile_payment_on_customer_cancel(order)

        order.status = OrderStatus.cancelled
        note = reason.strip() if reason and reason.strip() else CUSTOMER_CANCEL_NOTE
        event = OrderStatusEvent(
            order_id=order.id,
            status=OrderStatus.cancelled,
            note=note[:500],
        )
        await self._orders.add_event(event)

        await CustodyEventService(self._session).record(
            order.id,
            CustodyEventType.order_cancelled,
            actor_user_id=user_id,
            actor_role=CustodyActorRole.customer,
            metadata={
                "status": OrderStatus.cancelled.value,
                "payment_status": order.payment_status.value,
            },
        )
        await publish_order_status_update(order, event)
        OrderStatusWhatsAppNotifier.schedule(order, OrderStatus.cancelled)
        await FraudDetectionService(self._session).on_order_cancelled(user_id)

        await self._session.flush()
        refreshed = await self._orders.get_by_id(order.id)
        return refreshed or order

    async def _reconcile_payment_on_customer_cancel(self, order: Order) -> None:
        """Update payment_status so cancel cannot orphan a captured charge."""
        if order.payment_status == PaymentStatus.refunded:
            return

        if order.payment_status in (
            PaymentStatus.pending,
            PaymentStatus.pending_cod,
            PaymentStatus.failed,
        ):
            if order.payment_status != PaymentStatus.failed:
                order.payment_status = PaymentStatus.failed
            return

        if order.payment_status != PaymentStatus.paid:
            raise ConflictError("Cannot cancel order with unresolved payment status")

        # Paid — refund Razorpay capture (or mark refunded for COD / stub).
        if order.payment_method == PaymentMethod.razorpay:
            payment = await self._session.scalar(
                select(Payment).where(Payment.order_id == order.id),
            )
            provider = get_payment_provider()
            payment_ref = payment.razorpay_payment_id if payment else None
            if provider.is_configured and not payment_ref:
                raise ConflictError(
                    "Cannot cancel: paid order is missing a payment reference for refund",
                )
            try:
                await provider.refund(payment_ref or f"dev_{order.id}", order.total_inr)
            except ConflictError:
                raise
            except Exception as exc:  # noqa: BLE001 — no gateway body/PII in client errors
                raise ConflictError(
                    "Refund failed; cancel is blocked until payment is refunded",
                ) from exc
            if payment:
                payment.status = PaymentStatus.refunded

        order.payment_status = PaymentStatus.refunded

    async def update_status_partner(
        self,
        partner_user_id: UUID,
        order_id: UUID,
        status: OrderStatus,
        *,
        note: str | None = None,
    ) -> Order:
        order = await self._require_partner_order(partner_user_id, order_id)

        if order.status == status:
            return order

        if order.status in (OrderStatus.delivered, OrderStatus.cancelled):
            raise OrderInvalidTransitionError("Order is already in a terminal state")

        is_walk_in = order.order_source == OrderSource.walk_in

        if status == OrderStatus.delivered and not is_walk_in:
            raise ValidationError("Use delivery OTP verification to mark the order as delivered")

        self._validate_partner_transition(order, status)

        if not is_walk_in and status == OrderStatus.picked_up:
            if not await PickupEvidenceService(self._session).has_evidence(order.id):
                raise ValidationError("Upload pickup evidence before marking the order as picked up")
            if not await InventoryVerificationService(self._session).has_recorded_inventory(order.id):
                raise ValidationError("Record inventory before marking the order as picked up")

        order.status = status
        event = OrderStatusEvent(
            order_id=order.id,
            status=status,
            note=note,
        )
        await self._orders.add_event(event)

        custody = CustodyEventService(self._session)
        await custody.record_status_change(
            order.id,
            status,
            actor_user_id=partner_user_id,
            actor_role=CustodyActorRole.partner,
            metadata={"status": status.value},
        )
        await publish_order_status_update(order, event)

        OrderStatusWhatsAppNotifier.schedule(order, status)

        if status == OrderStatus.out_for_delivery and order.order_source != OrderSource.walk_in:
            from app.services.delivery_otp_service import DeliveryOtpService

            await DeliveryOtpService(self._session).generate_for_order(order.id)

        if status == OrderStatus.delivered and order.order_source == OrderSource.walk_in:
            from app.services.settlement_service import SettlementService

            await SettlementService(self._session).on_order_delivered(order)
            await CustodyEventService(self._session).record(
                order.id,
                CustodyEventType.delivered,
                actor_user_id=partner_user_id,
                actor_role=CustodyActorRole.partner,
                metadata={"status": status.value, "order_source": OrderSource.walk_in.value},
            )
            if order.user_id:
                from app.services.trust_score_service import TrustScoreService

                await TrustScoreService(self._session).on_successful_order(order.user_id, order.id)

        if status == OrderStatus.cancelled and order.user_id:
            await FraudDetectionService(self._session).on_order_cancelled(order.user_id)

        await self._session.flush()
        refreshed = await self._orders.get_by_id(order.id)
        return refreshed or order

    async def get_for_partner(self, partner_user_id: UUID, order_id: UUID) -> Order:
        """Load an order owned by the partner's laundry (with items)."""
        return await self._require_partner_order(partner_user_id, order_id)

    async def _require_partner_order(self, partner_user_id: UUID, order_id: UUID) -> Order:
        laundries = await self._laundries.list_by_owner(partner_user_id)
        if not laundries:
            raise NotFoundError("Partner laundry not found")
        laundry_ids = {laundry.id for laundry in laundries}
        order = await self._orders.get_by_id(order_id)
        if not order or order.laundry_id not in laundry_ids:
            raise NotFoundError("Order not found")
        return order

    def _validate_partner_transition(self, order: Order, target: OrderStatus) -> None:
        current = order.status
        if order.order_source == OrderSource.walk_in:
            expected = WALK_IN_NEXT_STATUS.get(current)
            if expected != target:
                raise OrderInvalidTransitionError("Invalid status transition for this walk-in order")
            return

        if current == OrderStatus.confirmed:
            if target in (OrderStatus.pickup_assigned, OrderStatus.cancelled):
                return
            raise OrderInvalidTransitionError("Partner can only accept or reject a confirmed order")

        expected = PARTNER_NEXT_STATUS.get(current)
        if expected != target:
            raise OrderInvalidTransitionError("Invalid status transition for this order")

    async def _allocate_tracking_code(self) -> str:
        for _ in range(8):
            code = f"DLM{secrets.token_hex(4).upper()}"
            existing = await self._orders.get_by_tracking_code(code)
            if not existing:
                return code
        raise ConflictError("Could not allocate tracking code")

    @staticmethod
    def _ensure_aware(value: datetime) -> datetime:
        if value.tzinfo is None:
            return value.replace(tzinfo=UTC)
        return value
