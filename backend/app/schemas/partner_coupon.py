"""Partner coupon CRUD schemas."""

from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PartnerCouponItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    code: str
    discount_percent: Decimal
    is_active: bool


class PartnerCouponCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str = Field(min_length=1, max_length=32)
    discount_percent: Decimal = Field(gt=0, le=100)
    is_active: bool = True


class PartnerCouponUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str | None = Field(default=None, min_length=1, max_length=32)
    discount_percent: Decimal | None = Field(default=None, gt=0, le=100)
    is_active: bool | None = None


class PartnerCouponValidateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str = Field(min_length=1, max_length=32)


class PartnerCouponValidateResult(BaseModel):
    code: str
    discount_percent: Decimal
