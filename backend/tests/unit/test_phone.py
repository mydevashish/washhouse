"""Phone normalization helpers for India CRM / booking requests."""

from __future__ import annotations

import pytest

from app.utils.phone import (
    normalize_phone,
    normalize_phone_pair,
    phone_digits,
    validate_indian_phone,
    validate_indian_phone_pair,
    validate_strict_indian_mobile,
)


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("9876543210", "+919876543210"),
        ("98765 43210", "+919876543210"),
        ("+91 98765-43210", "+919876543210"),
        ("919876543210", "+919876543210"),
        ("+919876543210", "+919876543210"),
        ("(98765) 43210", "+919876543210"),
    ],
)
def test_normalize_phone_india_variants(raw: str, expected: str) -> None:
    assert normalize_phone(raw) == expected


def test_phone_digits_strips_plus() -> None:
    assert phone_digits("+919876543210") == "919876543210"
    assert phone_digits("9876543210") == "919876543210"


def test_normalize_phone_pair_returns_e164_and_digits() -> None:
    pair = normalize_phone_pair("9876543210")
    assert pair.e164 == "+919876543210"
    assert pair.digits == "919876543210"


def test_validate_strict_indian_mobile_accepts_valid() -> None:
    assert validate_strict_indian_mobile("9876543210") == "+919876543210"


@pytest.mark.parametrize(
    "raw",
    [
        "12345",
        "5876543210",  # not 6–9 starter
        "+441234567890",
        "",
        "abcdefghij",
    ],
)
def test_validate_strict_indian_mobile_rejects_invalid(raw: str) -> None:
    with pytest.raises(ValueError, match="valid Indian mobile"):
        validate_strict_indian_mobile(raw)


def test_validate_indian_phone_pair_strict() -> None:
    pair = validate_indian_phone_pair("91 98765 43210")
    assert pair.e164 == "+919876543210"
    assert pair.digits == "919876543210"


def test_validate_indian_phone_keeps_marketing_compat() -> None:
    # Shared helper still accepts the same inputs as marketing forms.
    assert validate_indian_phone("9876543210") == "+919876543210"
