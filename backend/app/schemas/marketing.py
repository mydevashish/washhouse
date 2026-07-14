"""Marketing site request/response schemas."""

from __future__ import annotations

import re
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.enums import MarketingContactSubject, MarketingInvestmentRange

INDIAN_PHONE_PATTERN = re.compile(r"^(\+91[6-9]\d{9}|\+?[1-9]\d{9,14})$")
CONTACT_MESSAGE_MAX = 2000
CONTACT_MESSAGE_MIN = 10


def normalize_phone(value: str) -> str:
    cleaned = re.sub(r"\s+", "", value.strip())
    if re.fullmatch(r"^[6-9]\d{9}$", cleaned):
        return f"+91{cleaned}"
    if re.fullmatch(r"^91[6-9]\d{9}$", cleaned):
        return f"+{cleaned}"
    return cleaned


def validate_indian_phone(value: str) -> str:
    normalized = normalize_phone(value)
    if not INDIAN_PHONE_PATTERN.fullmatch(normalized):
        raise ValueError("Enter a valid Indian mobile number (e.g. +919876543210)")
    return normalized


class MarketingContactCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=100)
    phone: str = Field(min_length=8, max_length=20)
    email: EmailStr | None = None
    subject: MarketingContactSubject
    message: str = Field(min_length=CONTACT_MESSAGE_MIN, max_length=CONTACT_MESSAGE_MAX)

    @field_validator("name", "message", mode="before")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()

    @field_validator("phone", mode="before")
    @classmethod
    def normalize_and_validate_phone(cls, value: str) -> str:
        return validate_indian_phone(value)


class MarketingFranchiseInquiryCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=100)
    phone: str = Field(min_length=8, max_length=20)
    email: EmailStr
    city: str = Field(min_length=1, max_length=100)
    investment_range: MarketingInvestmentRange
    message: str = Field(min_length=CONTACT_MESSAGE_MIN, max_length=CONTACT_MESSAGE_MAX)

    @field_validator("name", "city", "message", mode="before")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()

    @field_validator("phone", mode="before")
    @classmethod
    def normalize_and_validate_phone(cls, value: str) -> str:
        return validate_indian_phone(value)


class MarketingSubmissionResponse(BaseModel):
    id: UUID
    status: str = "received"


class MarketingPublicStatsResponse(BaseModel):
    happy_customers: int
    cities_covered: int
    pickup_points: int
    garments_cleaned: int
    avg_review_rating: float | None = None
    customer_satisfaction_percent: int | None = None


class MarketingTestimonialResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, ser_json_by_alias=True)

    id: UUID
    name: str
    location: str
    rating: int
    text: str
    avatar_url: str = Field(serialization_alias="avatarUrl")
    is_featured: bool = Field(serialization_alias="isFeatured")
