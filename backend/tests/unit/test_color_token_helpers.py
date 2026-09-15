"""Unit tests for color token helpers (no DB)."""

from __future__ import annotations

from datetime import UTC, date, datetime
from decimal import Decimal
from uuid import uuid4

from app.models.enums import COLOR_TOKEN_LETTERS, ColorToken, OrderSource, OrderStatus
from app.models.order import Order, OrderItem
from app.services.color_token_service import format_token_code, ist_today
from app.services.order_tags_service import OrderTagsService, phone_last4


def test_format_token_code_letters() -> None:
    assert format_token_code(ColorToken.red, 42) == "R-42"
    assert COLOR_TOKEN_LETTERS[ColorToken.pink] == "K"
    assert COLOR_TOKEN_LETTERS[ColorToken.brown] == "W"
    assert COLOR_TOKEN_LETTERS[ColorToken.grey] == "E"


def test_phone_last4() -> None:
    assert phone_last4("+919876543210") == "3210"
    assert phone_last4("9876") == "9876"


def test_build_tags_per_line_and_per_piece() -> None:
    order = Order(
        id=uuid4(),
        laundry_id=uuid4(),
        order_source=OrderSource.walk_in,
        customer_name="Priya",
        customer_phone="+919876543210",
        status=OrderStatus.confirmed,
        tracking_code="DLMTEST01",
        color_token=ColorToken.blue,
        token_code="B-7",
        token_day_number=7,
        token_assigned_on=date(2026, 8, 8),
        pickup_at=datetime.now(UTC),
        delivery_at=datetime.now(UTC),
        subtotal_inr=Decimal("100"),
        delivery_fee_inr=Decimal("0"),
        cgst_inr=Decimal("9"),
        sgst_inr=Decimal("9"),
        total_inr=Decimal("118"),
    )
    order.items = [
        OrderItem(
            service_id=uuid4(),
            service_name="Shirt",
            quantity=2,
            unit_price_inr=Decimal("50"),
            line_total_inr=Decimal("100"),
        ),
    ]
    # TimestampMixin may leave created_at unset until flush — set for response
    order.created_at = datetime.now(UTC)

    per_line = OrderTagsService.build_response(order, "Demo Laundry", per_piece=False)
    assert per_line.token_code == "B-7"
    assert len(per_line.tags) == 2
    assert per_line.tags[0].kind.value == "bag_master"

    per_piece = OrderTagsService.build_response(order, "Demo Laundry", per_piece=True)
    assert len(per_piece.tags) == 3
    assert per_piece.tags[1].qty_index == "1/2"

    html = OrderTagsService.render_print_html(per_line)
    assert "B-7" in html
    assert "58mm" in html
    assert ist_today()  # callable


def test_build_tags_for_multiple_services_reset_counts_per_service() -> None:
    order = Order(
        id=uuid4(),
        laundry_id=uuid4(),
        order_source=OrderSource.walk_in,
        customer_name="Priya",
        customer_phone="+919876543210",
        status=OrderStatus.confirmed,
        tracking_code="DLMTEST02",
        color_token=ColorToken.red,
        token_code="R-12",
        token_day_number=12,
        token_assigned_on=date(2026, 8, 8),
        pickup_at=datetime.now(UTC),
        delivery_at=datetime.now(UTC),
        subtotal_inr=Decimal("200"),
        delivery_fee_inr=Decimal("0"),
        cgst_inr=Decimal("18"),
        sgst_inr=Decimal("18"),
        total_inr=Decimal("236"),
    )
    order.items = [
        OrderItem(
            service_id=uuid4(),
            service_name="Wash & Fold",
            quantity=3,
            unit_price_inr=Decimal("70"),
            line_total_inr=Decimal("210"),
        ),
        OrderItem(
            service_id=uuid4(),
            service_name="Wash & Iron",
            quantity=4,
            unit_price_inr=Decimal("80"),
            line_total_inr=Decimal("320"),
        ),
    ]
    order.created_at = datetime.now(UTC)

    per_piece = OrderTagsService.build_response(order, "Demo Laundry", per_piece=True)

    wf_tags = [tag for tag in per_piece.tags if tag.service_name == "Wash & Fold"]
    wi_tags = [tag for tag in per_piece.tags if tag.service_name == "Wash & Iron"]

    assert [tag.qty_index for tag in wf_tags] == ["1/3", "2/3", "3/3"]
    assert [tag.qty_index for tag in wi_tags] == ["1/4", "2/4", "3/4", "4/4"]
    assert [tag.piece_index for tag in wf_tags] == [1, 2, 3]
    assert [tag.piece_index for tag in wi_tags] == [1, 2, 3, 4]
