"""Partner-level commission overrides."""

from __future__ import annotations

import uuid
from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class PartnerCommissionOverride(Base, TimestampMixin):
    __tablename__ = "partner_commission_overrides"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    commission_rate: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
