"""Partner walk-in (offline) order entry."""

from __future__ import annotations

import secrets
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.models.catalog import LaundryItemPrice, PlatformCatalogItem
from app.models.enums import (
    CustodyActorRole,
    CustodyEventType,
    GarmentServiceType,
    OrderSource,
    OrderStatus,
)
from app.models.garment_catalog import LaundryGarmentItem
from app.models.laundry import LaundryService
from app.models.order import Order, OrderItem, OrderStatusEvent
from app.repositories.catalog import CatalogRepository
from app.repositories.laundry import LaundryRepository
from app.repositories.order import OrderRepository
from app.repositories.partner_garment_catalog import PartnerGarmentCatalogRepository
from app.repositories.partner_service_catalog import PartnerServiceCatalogRepository
from app.repositories.user import UserRepository
from app.repositories.walk_in_order import WalkInOrderRepository
from app.schemas.walk_in_order import WalkInCatalogProcess
from app.services.catalog_pricing import catalog_allows_press, catalog_price_mode
from app.services.color_token_service import ColorTokenService
from app.services.custody_event_service import CustodyEventService
from app.services.order_events import publish_order_status_update
from app.services.notifications.order_status_whatsapp_notifier import OrderStatusWhatsAppNotifier
from app.services.platform_config_service import PlatformConfigService
from app.services.partner_coupon_service import PartnerCouponService

GST_RATE_PERCENT = Decimal("18")
WALK_IN_NOTE = "Walk-in order recorded by partner"
GENDER_NOTE_PREFIX = "Gender:"
_SINGLE_GARMENT_RATE_PRIORITY: tuple[GarmentServiceType, ...] = (
    GarmentServiceType.commercial_service,
    GarmentServiceType.shoe_cleaning,
    GarmentServiceType.wash_and_fold,
    GarmentServiceType.wash_n_iron,
    GarmentServiceType.premium_laundry,
    GarmentServiceType.express_service,
    GarmentServiceType.on_hanger,
    GarmentServiceType.lint_remover,
    GarmentServiceType.starch,
)


class WalkInOrderService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._orders = OrderRepository(session)
        self._laundries = LaundryRepository(session)
        self._catalog = PartnerServiceCatalogRepository(session)
        self._garment_catalog = PartnerGarmentCatalogRepository(session)
        self._platform_catalog = CatalogRepository(session)
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
        customer_gender: str | None = None,
        expected_ready_at: datetime | None = None,
        coupon_code: str | None = None,
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
            quantity = int(raw["quantity"])
            if quantity < 1:
                raise ValidationError("Quantity must be at least 1")

            service = await self._resolve_line_service(laundry.id, raw)
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

        discount_inr, applied_code = await PartnerCouponService(self._session).resolve_discount(
            partner_user_id,
            coupon_code=coupon_code,
            subtotal=subtotal,
        )

        taxable = subtotal - discount_inr
        if taxable < Decimal("0"):
            taxable = Decimal("0")
        half_gst = (taxable * GST_RATE_PERCENT / Decimal("200")).quantize(Decimal("0.01"))
        cgst = half_gst
        sgst = half_gst
        total = (taxable + cgst + sgst).quantize(Decimal("0.01"))

        platform = PlatformConfigService(self._session)
        _min_amount, max_amount = await platform.get_order_limits()
        # Walk-in counter orders may be small (single garment); online min does not apply.
        if total > max_amount:
            raise ValidationError(f"Order total cannot exceed ₹{max_amount}")

        commission_rate = await platform.resolve_commission_rate(laundry)
        tracking_code = await self._allocate_tracking_code()
        token = await ColorTokenService(self._session).allocate(laundry.id)
        now = datetime.now(UTC)
        ready_at = self._ensure_aware(expected_ready_at) if expected_ready_at else now + timedelta(days=2)

        order = Order(
            user_id=linked_user.id if linked_user else None,
            laundry_id=laundry.id,
            address_id=None,
            order_source=OrderSource.walk_in,
            customer_name=customer_name.strip(),
            customer_phone=phone,
            partner_notes=self._compose_partner_notes(notes, customer_gender),
            status=OrderStatus.confirmed,
            tracking_code=tracking_code,
            color_token=token.color_token,
            token_code=token.token_code,
            token_day_number=token.token_day_number,
            token_assigned_on=token.token_assigned_on,
            pickup_at=now,
            delivery_at=ready_at,
            subtotal_inr=subtotal,
            discount_inr=discount_inr,
            coupon_code=applied_code,
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

    async def list_for_partner(
        self,
        partner_user_id: UUID,
        *,
        page: int = 1,
        page_size: int = 10,
        search: str | None = None,
    ) -> dict:
        from app.core.pagination import build_paginated_response, normalize_page_size

        laundry = await self._laundries.get_by_owner(partner_user_id)
        if not laundry:
            raise NotFoundError("Partner laundry not found")
        safe_page = max(1, page)
        safe_size = normalize_page_size(page_size)
        term = search.strip() if search and search.strip() else None
        total = await self._walk_in.count_by_laundry(laundry.id, search=term)
        offset = (safe_page - 1) * safe_size
        orders = await self._walk_in.list_by_laundry(
            laundry.id,
            limit=safe_size,
            offset=offset,
            search=term,
        )
        return build_paginated_response(
            items=orders,
            total_records=total,
            page=safe_page,
            page_size=safe_size,
        )

    async def _resolve_line_service(self, laundry_id: UUID, raw: dict[str, Any]) -> LaundryService:
        catalog_item_id = raw.get("catalog_item_id")
        if catalog_item_id is not None:
            return await self._resolve_catalog_service(
                laundry_id,
                UUID(str(catalog_item_id)),
                raw.get("process"),
            )

        garment_item_id = raw.get("garment_item_id")
        if garment_item_id is not None:
            return await self._resolve_garment_service(
                laundry_id,
                UUID(str(garment_item_id)),
                raw.get("process"),
            )

        service_id = UUID(str(raw["service_id"]))
        service = await self._catalog.get(service_id, laundry_id)
        if not service or not service.is_active or service.catalog_status != "active":
            raise ValidationError("One or more services are invalid or unavailable")
        return service

    async def _resolve_catalog_service(
        self,
        laundry_id: UUID,
        catalog_item_id: UUID,
        process_raw: Any,
    ) -> LaundryService:
        item = await self._platform_catalog.get_item_by_id(catalog_item_id)
        if not item or not item.is_active:
            raise ValidationError("One or more catalog items are invalid or unavailable")

        override = await self._platform_catalog.get_laundry_price(laundry_id, catalog_item_id)
        if not override or not override.is_offered:
            raise ValidationError("Catalog item is not offered by this laundry")

        process = self._resolve_process(item, override, process_raw)
        unit_price = self._unit_price_for_process(override, process)
        if unit_price is None:
            raise ValidationError(f"No price configured for {item.name} ({process.value})")

        display_name = self._service_display_name(item.name, process)
        existing = await self._catalog.get_by_catalog_bridge(
            laundry_id,
            catalog_item_id=catalog_item_id,
            process=process.value,
        )
        if existing:
            existing.name = display_name[:120]
            existing.price_inr = unit_price
            existing.category = item.category.value
            existing.unit = item.unit.value
            existing.is_active = True
            existing.catalog_status = "active"
            await self._session.flush()
            return existing

        marker = f"catalog:{catalog_item_id}:{process.value}"
        return await self._catalog.create(
            LaundryService(
                laundry_id=laundry_id,
                name=display_name[:120],
                category=item.category.value,
                unit=item.unit.value,
                price_inr=unit_price,
                description=marker,
                is_active=True,
                catalog_status="active",
            ),
        )

    async def _resolve_garment_service(
        self,
        laundry_id: UUID,
        garment_item_id: UUID,
        process_raw: Any,
    ) -> LaundryService:
        item = await self._garment_catalog.get(garment_item_id, laundry_id)
        if not item or not item.is_visible:
            raise ValidationError("One or more garment items are invalid or unavailable")

        try:
            process = WalkInCatalogProcess(str(process_raw))
        except ValueError as exc:
            raise ValidationError("Invalid garment process") from exc

        service_type, unit_price = self._garment_rate_for_process(item, process)
        if unit_price is None:
            raise ValidationError(f"No price configured for {item.name} ({process.value})")

        display_name = self._service_display_name(item.name, process)
        existing = await self._catalog.get_by_garment_bridge(
            laundry_id,
            garment_item_id=garment_item_id,
            process=process.value,
        )
        if existing:
            existing.name = display_name[:120]
            existing.price_inr = unit_price
            existing.category = item.category.value
            existing.unit = "piece"
            existing.is_active = True
            existing.catalog_status = "active"
            await self._session.flush()
            return existing

        marker = f"garment:{garment_item_id}:{process.value}"
        return await self._catalog.create(
            LaundryService(
                laundry_id=laundry_id,
                name=display_name[:120],
                category=item.category.value,
                unit="piece",
                price_inr=unit_price,
                description=marker,
                is_active=True,
                catalog_status="active",
            ),
        )

    @staticmethod
    def _garment_rate_for_process(
        item: LaundryGarmentItem,
        process: WalkInCatalogProcess,
    ) -> tuple[GarmentServiceType | None, Decimal | None]:
        active_rates = {
            rate.service_type: rate.price_inr
            for rate in item.service_rates
            if rate.deleted_at is None and rate.price_inr is not None
        }
        if process == WalkInCatalogProcess.dry_clean:
            price = active_rates.get(GarmentServiceType.dry_cleaning)
            return GarmentServiceType.dry_cleaning, price
        if process == WalkInCatalogProcess.press:
            price = active_rates.get(GarmentServiceType.steam_press)
            return GarmentServiceType.steam_press, price
        for service_type in _SINGLE_GARMENT_RATE_PRIORITY:
            price = active_rates.get(service_type)
            if price is not None:
                return service_type, price
        return None, None

    @staticmethod
    def _resolve_process(
        item: PlatformCatalogItem,
        override: LaundryItemPrice,
        process_raw: Any,
    ) -> WalkInCatalogProcess:
        mode = catalog_price_mode(item)
        if process_raw is not None:
            try:
                process = WalkInCatalogProcess(str(process_raw))
            except ValueError as exc:
                raise ValidationError("Invalid catalog process") from exc
        elif mode == "single" or override.price_inr is not None:
            process = WalkInCatalogProcess.single
        elif override.dry_clean_inr is not None:
            process = WalkInCatalogProcess.dry_clean
        elif override.press_inr is not None and catalog_allows_press(item):
            process = WalkInCatalogProcess.press
        else:
            raise ValidationError(f"No process available for {item.name}")

        if process == WalkInCatalogProcess.press and not catalog_allows_press(item):
            raise ValidationError(f"Press is not available for {item.name}")
        if process == WalkInCatalogProcess.single and override.price_inr is None:
            raise ValidationError(f"Single rate is not configured for {item.name}")
        if process == WalkInCatalogProcess.dry_clean and override.dry_clean_inr is None:
            raise ValidationError(f"Dry clean is not configured for {item.name}")
        if process == WalkInCatalogProcess.press and override.press_inr is None:
            raise ValidationError(f"Press is not configured for {item.name}")
        return process

    @staticmethod
    def _unit_price_for_process(
        override: LaundryItemPrice,
        process: WalkInCatalogProcess,
    ) -> Decimal | None:
        if process == WalkInCatalogProcess.single:
            return override.price_inr
        if process == WalkInCatalogProcess.dry_clean:
            return override.dry_clean_inr
        if process == WalkInCatalogProcess.press:
            return override.press_inr
        return None

    @staticmethod
    def _service_display_name(name: str, process: WalkInCatalogProcess) -> str:
        if process == WalkInCatalogProcess.dry_clean:
            return f"{name} · Dry clean"
        if process == WalkInCatalogProcess.press:
            return f"{name} · Press"
        return name

    async def _allocate_tracking_code(self) -> str:
        for _ in range(8):
            code = f"DLM{secrets.token_hex(4).upper()}"
            existing = await self._orders.get_by_tracking_code(code)
            if not existing:
                return code
        raise ConflictError("Could not allocate tracking code")

    @staticmethod
    def _compose_partner_notes(notes: str | None, customer_gender: str | None) -> str | None:
        parts: list[str] = []
        if customer_gender:
            label = "Male" if customer_gender == "male" else "Female"
            parts.append(f"{GENDER_NOTE_PREFIX} {label}")
        if notes and notes.strip():
            parts.append(notes.strip())
        return " · ".join(parts) if parts else None

    @staticmethod
    def _ensure_aware(value: datetime) -> datetime:
        if value.tzinfo is None:
            return value.replace(tzinfo=UTC)
        return value
