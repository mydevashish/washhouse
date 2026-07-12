"""Partner-customizable laundry storefront profiles."""

from __future__ import annotations

import uuid
from decimal import Decimal

import sqlalchemy as sa
from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class LaundryStorefront(Base, TimestampMixin):
    __tablename__ = "laundry_storefronts"

    laundry_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("laundries.id", ondelete="CASCADE"),
        primary_key=True,
    )
    template_id: Mapped[str] = mapped_column(String(40), nullable=False, default="premium")
    is_published: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    logo_url: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    cover_url: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    brand_primary: Mapped[str | None] = mapped_column(String(7), nullable=True)
    brand_secondary: Mapped[str | None] = mapped_column(String(7), nullable=True)
    tagline: Mapped[str | None] = mapped_column(String(300), nullable=True)
    brand_story: Mapped[str | None] = mapped_column(Text, nullable=True)
    years_in_business: Mapped[int | None] = mapped_column(Integer, nullable=True)
    owner_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    whatsapp_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    show_call: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    show_whatsapp: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    show_callback: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    approval_status: Mapped[str] = mapped_column(String(20), nullable=False, default="approved")
    working_hours: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    pickup_radius_km: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    delivery_radius_km: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    facilities: Mapped[list] = mapped_column(JSONB, nullable=False, server_default=sa.text("'[]'::jsonb"))
    highlights: Mapped[list] = mapped_column(JSONB, nullable=False, server_default=sa.text("'[]'::jsonb"))
    gallery: Mapped[list] = mapped_column(JSONB, nullable=False, server_default=sa.text("'[]'::jsonb"))
    machines: Mapped[list] = mapped_column(JSONB, nullable=False, server_default=sa.text("'[]'::jsonb"))
    team: Mapped[list] = mapped_column(JSONB, nullable=False, server_default=sa.text("'[]'::jsonb"))
    certifications: Mapped[list] = mapped_column(JSONB, nullable=False, server_default=sa.text("'[]'::jsonb"))
    videos: Mapped[list] = mapped_column(JSONB, nullable=False, server_default=sa.text("'[]'::jsonb"))
    completeness_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    def effective_contact_phone(self) -> str | None:
        phone = (self.contact_phone or "").strip()
        return phone or None

    def effective_whatsapp_number(self) -> str | None:
        number = (self.whatsapp_number or self.contact_phone or "").strip()
        return number or None

    def is_guest_visible(self) -> bool:
        return self.is_published and self.approval_status == "approved"

    def guest_contact_fields(self) -> dict[str, str | bool | None]:
        if not self.is_guest_visible():
            return {
                "phone": None,
                "whatsapp_number": None,
                "show_call": False,
                "show_whatsapp": False,
            }
        phone = self.effective_contact_phone()
        whatsapp = self.effective_whatsapp_number()
        show_call = self.show_call and bool(phone)
        show_whatsapp = self.show_whatsapp and bool(whatsapp)
        return {
            "phone": phone if show_call else None,
            "whatsapp_number": whatsapp if show_whatsapp else None,
            "show_call": show_call,
            "show_whatsapp": show_whatsapp,
        }
