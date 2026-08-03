"""India mobile phone normalization for CRM / booking requests."""

from __future__ import annotations

import re
from dataclasses import dataclass

# Matches marketing contact validation: Indian +91 mobile or loose E.164.
INDIAN_PHONE_PATTERN = re.compile(r"^(\+91[6-9]\d{9}|\+?[1-9]\d{9,14})$")
_STRICT_INDIAN_E164 = re.compile(r"^\+91[6-9]\d{9}$")


@dataclass(frozen=True, slots=True)
class NormalizedPhone:
    """Canonical E.164 plus digits-only form for WhatsApp / search."""

    e164: str
    digits: str


def normalize_phone(value: str) -> str:
    """Normalize common India inputs to E.164 (`+91XXXXXXXXXX`)."""
    cleaned = re.sub(r"[\s\-()]", "", value.strip())
    if cleaned.startswith("00"):
        cleaned = f"+{cleaned[2:]}"
    if re.fullmatch(r"^[6-9]\d{9}$", cleaned):
        return f"+91{cleaned}"
    if re.fullmatch(r"^91[6-9]\d{9}$", cleaned):
        return f"+{cleaned}"
    if re.fullmatch(r"^\+91[6-9]\d{9}$", cleaned):
        return cleaned
    return cleaned


def phone_digits(value: str) -> str:
    """Digits-only form of a phone (E.164 without `+`), for WhatsApp / search."""
    return re.sub(r"\D", "", normalize_phone(value))


def normalize_phone_pair(value: str) -> NormalizedPhone:
    """Return E.164 + digits-only for storage and lookup."""
    e164 = normalize_phone(value)
    return NormalizedPhone(e164=e164, digits=phone_digits(e164))


def validate_indian_phone(value: str) -> str:
    """Validate and return canonical E.164 (shared with marketing contact forms)."""
    normalized = normalize_phone(value)
    if not INDIAN_PHONE_PATTERN.fullmatch(normalized):
        raise ValueError("Enter a valid Indian mobile number (e.g. +919876543210)")
    return normalized


def validate_strict_indian_mobile(value: str) -> str:
    """Require `+91` + 10-digit Indian mobile (booking CRM key)."""
    normalized = normalize_phone(value)
    if not _STRICT_INDIAN_E164.fullmatch(normalized):
        raise ValueError("Enter a valid Indian mobile number (e.g. +919876543210)")
    return normalized


def validate_indian_phone_pair(value: str, *, strict: bool = True) -> NormalizedPhone:
    e164 = validate_strict_indian_mobile(value) if strict else validate_indian_phone(value)
    return NormalizedPhone(e164=e164, digits=phone_digits(e164))
