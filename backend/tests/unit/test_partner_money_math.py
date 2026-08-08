"""Unit tests for partner money growth / net helpers."""

from decimal import Decimal

from app.services.partner_money_math import (
    empty_money_fields,
    growth_pct,
    growth_pct_str,
    money_str,
    partner_net,
)


def test_growth_pct_null_when_prior_zero():
    assert growth_pct(Decimal("100"), Decimal("0")) is None
    assert growth_pct_str(Decimal("100"), Decimal("0")) is None


def test_growth_pct_positive_and_negative():
    assert growth_pct(Decimal("110"), Decimal("100")) == Decimal("10.00")
    assert growth_pct(Decimal("90"), Decimal("100")) == Decimal("-10.00")
    assert growth_pct_str(Decimal("200"), Decimal("100")) == "100.00"


def test_partner_net_and_money_str():
    assert partner_net(Decimal("100.00"), Decimal("10.00")) == Decimal("90.00")
    assert money_str(Decimal("10")) == "10.00"


def test_empty_money_fields_shape():
    fields = empty_money_fields()
    assert fields["effective_commission_rate"] == "10.00"
    assert fields["growth_today_pct"] is None
    assert fields["partner_net_today_inr"] == "0.00"
    assert fields["commission_today_inr"] == "0.00"
