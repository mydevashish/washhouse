"""Build bag/item tag payloads for Shop Floor print."""

from __future__ import annotations

from html import escape
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.order import Order
from app.repositories.laundry import LaundryRepository
from app.schemas.order_tags import OrderTagLine, OrderTagsResponse, TagKind
from app.services.color_token_service import ColorTokenService
from app.services.order_service import OrderService


def phone_last4(phone: str | None) -> str:
    digits = "".join(ch for ch in (phone or "") if ch.isdigit())
    if len(digits) >= 4:
        return digits[-4:]
    return digits or "----"


class OrderTagsService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._orders = OrderService(session)
        self._laundries = LaundryRepository(session)
        self._tokens = ColorTokenService(session)

    async def get_tags_for_partner(
        self,
        partner_user_id: UUID,
        order_id: UUID,
        *,
        per_piece: bool = False,
    ) -> OrderTagsResponse:
        order = await self._orders.get_for_partner(partner_user_id, order_id)
        await self._tokens.assign_to_order(order)
        laundry = await self._laundries.get_by_id(order.laundry_id)
        if not laundry:
            raise NotFoundError("Partner laundry not found")
        return self.build_response(order, laundry.name, per_piece=per_piece)

    @staticmethod
    def build_response(order: Order, laundry_name: str, *, per_piece: bool = False) -> OrderTagsResponse:
        if (
            order.color_token is None
            or not order.token_code
            or order.token_day_number is None
            or order.token_assigned_on is None
        ):
            raise NotFoundError("Order has no color token")

        items = list(order.items or [])
        piece_count = sum(int(i.quantity) for i in items)
        tags: list[OrderTagLine] = [
            OrderTagLine(
                kind=TagKind.bag_master,
                label="Bag",
                quantity=piece_count or 1,
                qty_index=f"{piece_count} pcs" if piece_count else "1 bag",
            ),
        ]

        if per_piece:
            running = 0
            for item in items:
                qty = int(item.quantity)
                for _ in range(qty):
                    running += 1
                    tags.append(
                        OrderTagLine(
                            kind=TagKind.item,
                            label=item.service_name,
                            service_name=item.service_name,
                            quantity=1,
                            qty_index=f"{running}/{piece_count}",
                            piece_index=running,
                            piece_total=piece_count,
                        ),
                    )
        else:
            for item in items:
                qty = int(item.quantity)
                tags.append(
                    OrderTagLine(
                        kind=TagKind.item,
                        label=item.service_name,
                        service_name=item.service_name,
                        quantity=qty,
                        qty_index=f"×{qty}",
                    ),
                )

        phone = order.customer_phone or ""
        return OrderTagsResponse(
            order_id=order.id,
            laundry_id=order.laundry_id,
            laundry_name=laundry_name,
            color_token=order.color_token,
            token_code=order.token_code,
            token_day_number=order.token_day_number,
            token_assigned_on=order.token_assigned_on,
            customer_name=order.customer_name or "Walk-in customer",
            customer_phone=phone,
            customer_phone_last4=phone_last4(phone),
            tracking_code=order.tracking_code,
            piece_count=piece_count,
            line_count=len(items),
            created_at=order.created_at,
            per_piece=per_piece,
            tags=tags,
        )

    @staticmethod
    def render_print_html(payload: OrderTagsResponse) -> str:
        """Minimal 58mm-friendly HTML for browser / thermal print."""
        swatch = {
            "red": "#dc2626",
            "blue": "#2563eb",
            "green": "#16a34a",
            "yellow": "#ca8a04",
            "orange": "#ea580c",
            "purple": "#7c3aed",
            "pink": "#db2777",
            "teal": "#0d9488",
            "brown": "#92400e",
            "grey": "#4b5563",
        }.get(payload.color_token.value, "#111827")

        blocks: list[str] = []
        for tag in payload.tags:
            kind_label = "BAG" if tag.kind == TagKind.bag_master else "ITEM"
            item_line = escape(tag.label)
            qty = escape(tag.qty_index or "")
            blocks.append(
                f"""
<section class="tag">
  <div class="bar" style="background:{swatch}"></div>
  <p class="kind">{kind_label}</p>
  <p class="token">{escape(payload.token_code)}</p>
  <p class="meta">{escape(payload.customer_name)} · …{escape(payload.customer_phone_last4)}</p>
  <p class="item">{item_line} {qty}</p>
  <p class="track">{escape(payload.tracking_code)}</p>
  <p class="shop">{escape(payload.laundry_name)}</p>
</section>
""",
            )

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Tags {escape(payload.token_code)}</title>
<style>
  @page {{ size: 58mm auto; margin: 2mm; }}
  * {{ box-sizing: border-box; }}
  body {{
    margin: 0;
    font-family: system-ui, sans-serif;
    color: #111;
    background: #fff;
  }}
  .tag {{
    width: 54mm;
    padding: 3mm;
    page-break-after: always;
    border-bottom: 1px dashed #ccc;
  }}
  .bar {{ height: 8mm; border-radius: 1mm; margin-bottom: 2mm; }}
  .kind {{ margin: 0; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; }}
  .token {{ margin: 1mm 0; font-size: 28px; font-weight: 800; line-height: 1.1; }}
  .meta, .item, .track, .shop {{ margin: 0.5mm 0; font-size: 11px; }}
  .track {{ font-family: ui-monospace, monospace; font-weight: 600; }}
  @media print {{
    .no-print {{ display: none !important; }}
    .tag {{ border-bottom: none; }}
  }}
</style>
</head>
<body>
<button class="no-print" onclick="window.print()" style="margin:8px;padding:8px 12px;font-size:14px">Print</button>
{"".join(blocks)}
<script>window.addEventListener('load',()=>{{/* auto-print optional */}});</script>
</body>
</html>
"""
