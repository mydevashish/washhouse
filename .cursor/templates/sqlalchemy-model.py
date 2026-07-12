# Template: SQLAlchemy ORM model
# Save as: backend/app/models/<resource>.py
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin


class <Resource>(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "<resource_plural>"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        server_default="gen_random_uuid()",
    )
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(nullable=True)

    user = relationship("User", back_populates="<resource_plural>", lazy="raise")

    __table_args__ = (
        Index("ix_<resource_plural>_user_id", "user_id"),
    )
