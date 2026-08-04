"""Customer Desk — phone/user lookup, history, and assisted doorstep create."""

from __future__ import annotations

import re
import secrets
from datetime import date, datetime, time
from datetime import UTC
from decimal import Decimal
from typing import Any
from uuid import UUID

from sqlalchemy import Select, and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ConflictError, LaundryNotApprovedError, NotFoundError, ValidationError
from app.core.pagination import build_paginated_response
from app.models.enums import (
    CustodyActorRole,
    CustodyEventType,
    LaundryStatus,
    OrderSource,
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
    UserRole,
)
from app.models.laundry import Laundry
from app.models.order import Order, OrderItem, OrderStatusEvent
from app.models.user import User
from app.repositories.address import AddressRepository
from app.repositories.laundry import LaundryRepository
from app.repositories.order import OrderRepository
from app.repositories.partner_service_catalog import PartnerServiceCatalogRepository
from app.repositories.user import UserRepository
from app.services.custody_event_service import CustodyEventService
from app.services.order_events import publish_order_status_update
from app.services.platform_config_service import PlatformConfigService
from app.utils.phone import validate_strict_indian_mobile

DELIVERY_FEE_INR = Decimal("49")
GST_RATE_PERCENT = Decimal("18")
ASSISTED_ADMIN_NOTE = "Assisted doorstep order created by admin"
ASSISTED_PARTNER_NOTE = "Assisted doorstep order created by partner"
_UUID_RE = re.compile(
    r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
)
_SEARCH_MAX = 20
_SEARCH_MIN_LEN = 2


class CustomerDeskService:
    """Shared lookup + history + assisted create for admin and partner."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._users = UserRepository(session)
        self._laundries = LaundryRepository(session)
        self._orders = OrderRepository(session)
        self._addresses = AddressRepository(session)
        self._catalog = PartnerServiceCatalogRepository(session)

    async def lookup(
        self,
        *,
        phone: str | None = None,
        user_id: UUID | None = None,
        laundry_id: UUID | None = None,
        require_laundry_touch: bool = False,
    ) -> dict:
        """Resolve a desk profile by phone (E.164) or user_id.

        Admin: laundry_id=None (platform-wide counts).
        Partner: pass laundry_id; order_count is scoped. When require_laundry_touch
        and the phone/user has no orders at that laundry and is not a registered
        user, raise NotFoundError (IDOR-safe).
        """
        if not phone and not user_id:
            raise ValidationError("Provide phone or user_id")
        if phone and user_id:
            raise ValidationError("Provide phone or user_id, not both")

        phone_e164: str | None = None
        user: User | None = None

        if user_id is not None:
            user = await self._users.get_by_id(user_id)
            if not user:
                raise NotFoundError("Customer not found")
            phone_e164 = user.phone
        else:
            assert phone is not None
            try:
                phone_e164 = validate_strict_indian_mobile(phone)
            except ValueError as exc:
                raise ValidationError(str(exc)) from exc
            user = await self._users.get_by_phone(phone_e164)

        order_count, last_order_at, guest_name = await self._order_stats(
            phone_e164=phone_e164,
            user_id=user.id if user else None,
            laundry_id=laundry_id,
        )

        if require_laundry_touch and laundry_id is not None:
            # Partner: allow registered users (order_count may be 0) or any own-laundry touch.
            if user is None and order_count == 0:
                raise NotFoundError("Customer not found")

        display_phone = phone_e164 or (user.phone if user else None)
        if not display_phone:
            display_phone = ""

        return {
            "user_id": user.id if user else None,
            "name": (user.full_name if user else None) or guest_name,
            "phone": display_phone,
            "email": user.email if user else None,
            "registered": user is not None,
            "order_count": order_count,
            "last_order_at": last_order_at,
        }

    async def search(
        self,
        *,
        q: str,
        laundry_id: UUID | None = None,
        limit: int = _SEARCH_MAX,
    ) -> list[dict]:
        """Search desk profiles by name, phone fragment, exact phone, or user_id UUID.

        Admin: platform-wide registered customers + guest phones from orders.
        Partner: only phones/users with at least one order at ``laundry_id``.
        Caps at ``limit`` (max 20) — no mass export.
        """
        term = (q or "").strip()
        if len(term) < _SEARCH_MIN_LEN:
            raise ValidationError(f"Search query must be at least {_SEARCH_MIN_LEN} characters")
        limit = max(1, min(int(limit), _SEARCH_MAX))

        # Exact user_id paste
        if _UUID_RE.fullmatch(term):
            try:
                profile = await self.lookup(
                    user_id=UUID(term),
                    laundry_id=laundry_id,
                    require_laundry_touch=laundry_id is not None,
                )
            except NotFoundError:
                return []
            return [profile]

        # Exact Indian mobile → single lookup (admin guest stub / partner touch rules)
        try:
            phone_e164 = validate_strict_indian_mobile(term)
        except ValueError:
            phone_e164 = None
        if phone_e164:
            try:
                profile = await self.lookup(
                    phone=phone_e164,
                    laundry_id=laundry_id,
                    require_laundry_touch=False,
                )
            except NotFoundError:
                return []
            if laundry_id is not None and not profile["registered"] and profile["order_count"] == 0:
                return []
            return [profile]

        candidates: dict[str, dict[str, Any]] = {}
        phone_digits = re.sub(r"\D", "", term)
        name_like = f"%{term}%"
        phone_like = f"%{phone_digits}%" if len(phone_digits) >= 4 else None

        # Registered customers by name (and optional phone fragment)
        user_clauses = [
            User.deleted_at.is_(None),
            User.role == UserRole.customer,
            User.phone.is_not(None),
            User.full_name.ilike(name_like),
        ]
        if phone_like:
            user_clauses = [
                User.deleted_at.is_(None),
                User.role == UserRole.customer,
                User.phone.is_not(None),
                or_(User.full_name.ilike(name_like), User.phone.ilike(phone_like)),
            ]
        user_stmt = select(User).where(and_(*user_clauses)).limit(limit * 3)
        users = list((await self._session.execute(user_stmt)).scalars().all())

        if laundry_id is not None and users:
            # Partner: keep only users with own-laundry touch (by user_id or phone).
            phones = [u.phone for u in users if u.phone]
            touch_stmt = (
                select(Order.user_id, Order.customer_phone)
                .where(
                    Order.deleted_at.is_(None),
                    Order.laundry_id == laundry_id,
                    or_(
                        Order.user_id.in_([u.id for u in users]),
                        Order.customer_phone.in_(phones) if phones else and_(False),
                    ),
                )
                .distinct()
            )
            touch_rows = (await self._session.execute(touch_stmt)).all()
            touched_user_ids = {r[0] for r in touch_rows if r[0]}
            touched_phones = {r[1] for r in touch_rows if r[1]}
            users = [
                u
                for u in users
                if u.id in touched_user_ids or (u.phone and u.phone in touched_phones)
            ]

        for user in users:
            if not user.phone:
                continue
            candidates[user.phone] = {
                "user_id": user.id,
                "name": user.full_name,
                "phone": user.phone,
                "email": user.email,
                "registered": True,
            }

        # Guest / order-derived phones by name or phone fragment
        order_clauses = [Order.deleted_at.is_(None), Order.customer_phone.is_not(None)]
        if laundry_id is not None:
            order_clauses.append(Order.laundry_id == laundry_id)
        name_or_phone = [Order.customer_name.ilike(name_like)]
        if phone_like:
            name_or_phone.append(Order.customer_phone.ilike(phone_like))
        order_clauses.append(or_(*name_or_phone))

        order_stmt = (
            select(
                Order.customer_phone,
                func.max(Order.customer_name),
            )
            .where(and_(*order_clauses))
            .group_by(Order.customer_phone)
            .limit(limit * 3)
        )
        for phone, guest_name in (await self._session.execute(order_stmt)).all():
            if not phone or phone in candidates:
                continue
            # Prefer linking registered user if phone matches a user not already added
            user = await self._users.get_by_phone(phone)
            if user:
                candidates[phone] = {
                    "user_id": user.id,
                    "name": user.full_name,
                    "phone": phone,
                    "email": user.email,
                    "registered": True,
                }
            else:
                candidates[phone] = {
                    "user_id": None,
                    "name": guest_name,
                    "phone": phone,
                    "email": None,
                    "registered": False,
                }

        # Enrich with scoped order stats and sort
        results: list[dict] = []
        for phone, stub in candidates.items():
            count, last_at, guest_name = await self._order_stats(
                phone_e164=phone,
                user_id=stub.get("user_id"),
                laundry_id=laundry_id,
            )
            if laundry_id is not None and count == 0 and not stub.get("registered"):
                continue
            if laundry_id is not None and count == 0:
                # Partner: registered with zero own-laundry orders — omit from name search
                continue
            results.append(
                {
                    "user_id": stub.get("user_id"),
                    "name": stub.get("name") or guest_name,
                    "phone": phone,
                    "email": stub.get("email"),
                    "registered": bool(stub.get("registered")),
                    "order_count": count,
                    "last_order_at": last_at,
                },
            )

        results.sort(
            key=lambda r: (
                r["last_order_at"] is None,
                -(r["last_order_at"].timestamp() if r["last_order_at"] else 0),
                (r["name"] or "").lower(),
            ),
        )
        return results[:limit]

    async def list_orders(
        self,
        *,
        user_id: UUID | None = None,
        phone: str | None = None,
        laundry_id: UUID | None = None,
        status: OrderStatus | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        q: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> dict:
        """Paginated past orders newest-first. Partner must pass laundry_id first."""
        if not user_id and not phone:
            raise ValidationError("Provide user_id or phone")

        phone_e164: str | None = None
        resolved_user_id = user_id

        if phone:
            try:
                phone_e164 = validate_strict_indian_mobile(phone)
            except ValueError as exc:
                raise ValidationError(str(exc)) from exc

        if resolved_user_id is not None:
            user = await self._users.get_by_id(resolved_user_id)
            if not user:
                raise NotFoundError("Customer not found")
            if phone_e164 is None and user.phone:
                phone_e164 = user.phone

        stmt = (
            select(Order, Laundry.name)
            .join(Laundry, Laundry.id == Order.laundry_id)
            .where(Order.deleted_at.is_(None))
            .options(selectinload(Order.items))
        )
        # Partner scope: laundry_id first so index (laundry_id, customer_phone, created_at) applies.
        if laundry_id is not None:
            stmt = stmt.where(Order.laundry_id == laundry_id)
        stmt = self._apply_identity_filter(stmt, user_id=resolved_user_id, phone_e164=phone_e164)

        if status is not None:
            stmt = stmt.where(Order.status == status)

        if date_from is not None:
            start = datetime.combine(date_from, time.min, tzinfo=UTC)
            stmt = stmt.where(Order.created_at >= start)
        if date_to is not None:
            end = datetime.combine(date_to, time.max, tzinfo=UTC)
            stmt = stmt.where(Order.created_at <= end)

        if q and q.strip():
            term = f"%{q.strip()}%"
            stmt = stmt.where(Order.tracking_code.ilike(term))

        stmt = stmt.order_by(Order.created_at.desc())

        count_stmt = select(func.count()).select_from(stmt.order_by(None).subquery())
        total = int(await self._session.scalar(count_stmt) or 0)

        safe_page = max(1, page)
        safe_size = min(max(1, page_size), 100)
        result = await self._session.execute(
            stmt.offset((safe_page - 1) * safe_size).limit(safe_size),
        )
        rows = result.all()

        items = []
        for order, laundry_name in rows:
            item_summary = None
            if order.items:
                item_summary = ", ".join(
                    f"{item.service_name} ×{item.quantity}" for item in order.items
                )
            items.append(
                {
                    "id": order.id,
                    "tracking_code": order.tracking_code,
                    "status": order.status,
                    "order_source": order.order_source,
                    "laundry_id": order.laundry_id,
                    "laundry_name": laundry_name,
                    "customer_name": order.customer_name,
                    "customer_phone": order.customer_phone,
                    "subtotal_inr": order.subtotal_inr,
                    "delivery_fee_inr": order.delivery_fee_inr,
                    "cgst_inr": order.cgst_inr,
                    "sgst_inr": order.sgst_inr,
                    "total_inr": order.total_inr,
                    "currency": order.currency,
                    "pickup_at": order.pickup_at,
                    "delivery_at": order.delivery_at,
                    "created_at": order.created_at,
                    "created_by_user_id": order.created_by_user_id,
                    "item_summary": item_summary,
                },
            )

        return build_paginated_response(
            items=items,
            total_records=total,
            page=safe_page,
            page_size=safe_size,
        )

    async def quote_assisted(
        self,
        *,
        laundry_id: UUID,
        items: list[dict[str, Any]],
        partner_laundry_id: UUID | None = None,
    ) -> dict:
        laundry_id = self._resolve_laundry_id(laundry_id, partner_laundry_id)
        priced = await self._price_lines(laundry_id, items)
        return {
            "subtotal_inr": priced["subtotal"],
            "delivery_fee_inr": priced["delivery_fee"],
            "gst_rate": GST_RATE_PERCENT,
            "cgst_inr": priced["cgst"],
            "sgst_inr": priced["sgst"],
            "total_inr": priced["total"],
            "currency": "INR",
            "warnings": priced["warnings"],
        }

    async def create_assisted(
        self,
        *,
        actor_user_id: UUID,
        order_source: OrderSource,
        phone: str,
        customer_name: str,
        laundry_id: UUID,
        pickup_at: datetime,
        delivery_at: datetime,
        items: list[dict[str, Any]],
        idempotency_key: str,
        address_id: UUID | None = None,
        address: dict[str, Any] | None = None,
        notes: str | None = None,
        payment_method: PaymentMethod = PaymentMethod.cod,
        partner_laundry_id: UUID | None = None,
        save_address_to_user: bool = False,
    ) -> Order:
        if order_source not in {OrderSource.assisted_admin, OrderSource.assisted_partner}:
            raise ValidationError("Invalid assisted order_source")

        key = (idempotency_key or "").strip()
        if not key or len(key) > 128:
            raise ValidationError("Idempotency-Key is required (max 128 chars)")

        existing = await self._orders.get_by_idempotency_key(key)
        if existing:
            return existing

        laundry_id = self._resolve_laundry_id(laundry_id, partner_laundry_id)

        try:
            phone_e164 = validate_strict_indian_mobile(phone)
        except ValueError as exc:
            raise ValidationError(str(exc)) from exc

        linked_user = await self._users.get_by_phone(phone_e164)

        laundry = await self._laundries.get_by_id(laundry_id)
        if not laundry or laundry.status != LaundryStatus.approved:
            raise LaundryNotApprovedError("Laundry is not available for booking")

        pickup = self._ensure_aware(pickup_at)
        delivery = self._ensure_aware(delivery_at)
        if delivery <= pickup:
            raise ValidationError("Delivery time must be after pickup time")

        resolved_address_id: UUID | None = None
        snap: dict[str, str | None] = {
            "address_line1": None,
            "address_line2": None,
            "address_city": None,
            "address_pincode": None,
            "address_landmark": None,
        }

        if address_id is not None:
            if linked_user is None:
                raise ValidationError("address_id requires a registered customer for this phone")
            addr = await self._addresses.get_by_id(address_id, linked_user.id)
            if not addr:
                raise ValidationError("Address not found")
            resolved_address_id = addr.id
        else:
            if not address:
                raise ValidationError("Address snapshot is required for guest doorstep orders")
            line1 = str(address.get("line1") or "").strip()
            city = str(address.get("city") or "").strip()
            pincode = str(address.get("pincode") or "").strip()
            if not line1 or not city or not pincode:
                raise ValidationError("address line1, city, and pincode are required")
            if not pincode.isdigit() or len(pincode) != 6:
                raise ValidationError("Pincode must be 6 digits")
            snap = {
                "address_line1": line1,
                "address_line2": (str(address["line2"]).strip() if address.get("line2") else None),
                "address_city": city,
                "address_pincode": pincode,
                "address_landmark": (
                    str(address["landmark"]).strip() if address.get("landmark") else None
                ),
            }
            if save_address_to_user and linked_user is not None:
                # v1: snapshot on order only; saving to user_addresses deferred.
                pass

        priced = await self._price_lines(laundry_id, items)
        if not priced["line_items"]:
            raise ValidationError("At least one valid service line is required")

        platform = PlatformConfigService(self._session)
        min_amount, max_amount = await platform.get_order_limits()
        total = priced["total"]
        if total < min_amount:
            raise ValidationError(f"Order total must be at least ₹{min_amount}")
        if total > max_amount:
            raise ValidationError(f"Order total cannot exceed ₹{max_amount}")

        commission_rate = await platform.resolve_commission_rate(laundry)
        tracking_code = await self._allocate_tracking_code()
        note = (
            ASSISTED_ADMIN_NOTE
            if order_source == OrderSource.assisted_admin
            else ASSISTED_PARTNER_NOTE
        )
        actor_role = (
            CustodyActorRole.admin
            if order_source == OrderSource.assisted_admin
            else CustodyActorRole.partner
        )

        order = Order(
            user_id=linked_user.id if linked_user else None,
            laundry_id=laundry_id,
            address_id=resolved_address_id,
            order_source=order_source,
            customer_name=customer_name.strip(),
            customer_phone=phone_e164,
            created_by_user_id=actor_user_id,
            address_line1=snap["address_line1"],
            address_line2=snap["address_line2"],
            address_city=snap["address_city"],
            address_pincode=snap["address_pincode"],
            address_landmark=snap["address_landmark"],
            idempotency_key=key,
            status=OrderStatus.confirmed,
            tracking_code=tracking_code,
            pickup_at=pickup,
            delivery_at=delivery,
            notes=notes,
            subtotal_inr=priced["subtotal"],
            delivery_fee_inr=priced["delivery_fee"],
            gst_rate=GST_RATE_PERCENT,
            cgst_inr=priced["cgst"],
            sgst_inr=priced["sgst"],
            total_inr=total,
            commission_rate=commission_rate,
            payment_method=payment_method,
            payment_status=(
                PaymentStatus.pending_cod
                if payment_method == PaymentMethod.cod
                else PaymentStatus.pending
            ),
        )
        order = await self._orders.create(order)

        for item in priced["line_items"]:
            item.order_id = order.id
            self._session.add(item)

        event = OrderStatusEvent(
            order_id=order.id,
            status=OrderStatus.confirmed,
            note=note,
        )
        await self._orders.add_event(event)
        await CustodyEventService(self._session).record(
            order.id,
            CustodyEventType.order_confirmed,
            actor_user_id=actor_user_id,
            actor_role=actor_role,
            metadata={
                "tracking_code": tracking_code,
                "total_inr": str(total),
                "order_source": order_source.value,
                "phone_e164": phone_e164,
                "guest": linked_user is None,
            },
        )
        await publish_order_status_update(order, event)
        await self._session.flush()
        return await self._orders.get_by_id(order.id) or order

    async def laundry_id_for_partner(self, partner_user_id: UUID) -> UUID:
        laundry = await self._laundries.get_by_owner(partner_user_id)
        if not laundry:
            raise NotFoundError("Partner laundry not found")
        return laundry.id

    async def _order_stats(
        self,
        *,
        phone_e164: str | None,
        user_id: UUID | None,
        laundry_id: UUID | None,
    ) -> tuple[int, datetime | None, str | None]:
        if not phone_e164 and not user_id:
            return 0, None, None

        stmt = select(
            func.count(Order.id),
            func.max(Order.created_at),
            func.max(Order.customer_name),
        ).where(Order.deleted_at.is_(None))
        if laundry_id is not None:
            stmt = stmt.where(Order.laundry_id == laundry_id)
        stmt = self._apply_identity_filter(stmt, user_id=user_id, phone_e164=phone_e164)

        row = (await self._session.execute(stmt)).one()
        count = int(row[0] or 0)
        last_at = row[1]
        guest_name = row[2]
        return count, last_at, guest_name

    async def _price_lines(self, laundry_id: UUID, items: list[dict[str, Any]]) -> dict:
        if not items:
            raise ValidationError("At least one service line is required")

        line_items: list[OrderItem] = []
        warnings: list[str] = []
        subtotal = Decimal("0")
        for raw in items:
            service_id = UUID(str(raw["service_id"]))
            quantity = int(raw["quantity"])
            if quantity < 1:
                raise ValidationError("Quantity must be at least 1")

            service = await self._catalog.get(service_id, laundry_id)
            if not service or not service.is_active or service.catalog_status != "active":
                warnings.append(f"Service {service_id} is no longer offered and was skipped")
                continue

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

        if not line_items:
            raise ValidationError("Catalog changed — pick services")

        delivery_fee = DELIVERY_FEE_INR
        taxable = subtotal + delivery_fee
        half_gst = (taxable * GST_RATE_PERCENT / Decimal("200")).quantize(Decimal("0.01"))
        cgst = half_gst
        sgst = half_gst
        total = (taxable + cgst + sgst).quantize(Decimal("0.01"))
        return {
            "line_items": line_items,
            "subtotal": subtotal,
            "delivery_fee": delivery_fee,
            "cgst": cgst,
            "sgst": sgst,
            "total": total,
            "warnings": warnings,
        }

    @staticmethod
    def _resolve_laundry_id(laundry_id: UUID, partner_laundry_id: UUID | None) -> UUID:
        if partner_laundry_id is not None:
            # Partner: never trust client laundry_id — force own laundry.
            return partner_laundry_id
        return laundry_id

    async def _allocate_tracking_code(self) -> str:
        for _ in range(8):
            code = f"DLM{secrets.token_hex(4).upper()}"
            existing = await self._orders.get_by_tracking_code(code)
            if not existing:
                return code
        raise ConflictError("Could not allocate tracking code")

    @staticmethod
    def _apply_identity_filter(
        stmt: Select,
        *,
        user_id: UUID | None,
        phone_e164: str | None,
    ) -> Select:
        clauses = []
        if user_id is not None:
            clauses.append(Order.user_id == user_id)
        if phone_e164:
            clauses.append(Order.customer_phone == phone_e164)
        if not clauses:
            return stmt.where(and_(False))
        if len(clauses) == 1:
            return stmt.where(clauses[0])
        return stmt.where(or_(*clauses))

    @staticmethod
    def _ensure_aware(value: datetime) -> datetime:
        if value.tzinfo is None:
            return value.replace(tzinfo=UTC)
        return value
