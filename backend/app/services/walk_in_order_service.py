"""Partner walk-in (offline) order entry."""

from __future__ import annotations

import secrets
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.models.enums import CustodyActorRole, CustodyEventType, OrderSource, OrderStatus
from app.models.order import Order, OrderItem, OrderStatusEvent
from app.repositories.laundry import LaundryRepository
from app.repositories.order import OrderRepository
from app.repositories.partner_service_catalog import PartnerServiceCatalogRepository
from app.repositories.user import UserRepository
from app.repositories.walk_in_order import WalkInOrderRepository
from app.services.custody_event_service import CustodyEventService
from app.services.order_events import publish_order_status_update
from app.services.notifications.order_status_whatsapp_notifier import OrderStatusWhatsAppNotifier
from app.services.platform_config_service import PlatformConfigService

GST_RATE_PERCENT = Decimal("18")
WALK_IN_NOTE = "Walk-in order recorded by partner"


class WalkInOrderService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._orders = OrderRepository(session)
        self._laundries = LaundryRepository(session)
        self._catalog = PartnerServiceCatalogRepository(session)
        self._users = UserRepository(session)
        self._walk_in = WalkInOrderRepository(session)

    async def create(
        self,
        partner_user_id: UUID,
        *,
        customer_name: str,
        customer_phone: str,
        items: list[dict[str, Any]],
        notes: str | None = None,
        expected_ready_at: datetime | None = None,
    ) -> Order:
        laundry = await self._laundries.get_by_owner(partner_user_id)
        if not laundry:
            raise NotFoundError("Partner laundry not found")

        if not items:
            raise ValidationError("At least one service line is required")

        phone = customer_phone.strip()
        linked_user = await self._users.get_by_phone(phone)

        line_items: list[OrderItem] = []
        subtotal = Decimal("0")
        for raw in items:
            service_id = UUID(str(raw["service_id"]))
            quantity = int(raw["quantity"])
            if quantity < 1:
                raise ValidationError("Quantity must be at least 1")

            service = await self._catalog.get(service_id, laundry.id)
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

        taxable = subtotal
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
        now = datetime.now(UTC)
        ready_at = self._ensure_aware(expected_ready_at) if expected_ready_at else now + timedelta(days=2)

        order = Order(
            user_id=linked_user.id if linked_user else None,
            laundry_id=laundry.id,
            address_id=None,
            order_source=OrderSource.walk_in,
            customer_name=customer_name.strip(),
            customer_phone=phone,
            partner_notes=notes,
            status=OrderStatus.confirmed,
            tracking_code=tracking_code,
            pickup_at=now,
            delivery_at=ready_at,
            subtotal_inr=subtotal,
            delivery_fee_inr=Decimal("0"),
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
            note=WALK_IN_NOTE,
        )
        await self._orders.add_event(event)
        await CustodyEventService(self._session).record(
            order.id,
            CustodyEventType.order_confirmed,
            actor_user_id=partner_user_id,
            actor_role=CustodyActorRole.partner,
            metadata={
                "tracking_code": tracking_code,
                "total_inr": str(total),
                "order_source": OrderSource.walk_in.value,
                "customer_phone": phone,
            },
        )
        await publish_order_status_update(order, event)
        OrderStatusWhatsAppNotifier.schedule(order, OrderStatus.confirmed)
        await self._session.flush()
        return await self._orders.get_by_id(order.id) or order

    async def list_for_partner(self, partner_user_id: UUID) -> list[Order]:
        laundry = await self._laundries.get_by_owner(partner_user_id)
        if not laundry:
            raise NotFoundError("Partner laundry not found")
        return await self._walk_in.list_by_laundry(laundry.id)

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
