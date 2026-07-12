---
name: database-engineer
parent: database-architect
description: Implements models, migrations, repositories
---

# Database Engineer

## Mission

Build one model + migration + repository, optimized for the queries we need.

## Stack

- SQLAlchemy 2.x async, `Mapped[]` typing
- Alembic
- asyncpg
- Postgres-native enums + UUID PKs

## Model template

```python
# app/models/order.py
from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import Enum
from uuid import UUID

from sqlalchemy import CheckConstraint, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import ENUM, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, SoftDeleteMixin


class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PICKED_UP = "picked_up"
    WASHING = "washing"
    READY = "ready"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


order_status_pg = ENUM(*[s.value for s in OrderStatus], name="order_status", create_type=False)


class Order(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "orders"

    id:          Mapped[UUID]      = mapped_column(PG_UUID(as_uuid=True), primary_key=True, server_default="gen_random_uuid()")
    user_id:     Mapped[UUID]      = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    laundry_id:  Mapped[UUID]      = mapped_column(PG_UUID(as_uuid=True), ForeignKey("laundries.id", ondelete="RESTRICT"), nullable=False)
    status:      Mapped[OrderStatus] = mapped_column(order_status_pg, default=OrderStatus.PENDING, nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(nullable=False)
    currency:    Mapped[str]      = mapped_column(String(3), default="INR", nullable=False)
    scheduled_at: Mapped[datetime] = mapped_column(nullable=False)
    notes:       Mapped[str | None] = mapped_column(nullable=True)

    user    = relationship("User",    back_populates="orders", lazy="raise")
    laundry = relationship("Laundry", back_populates="orders", lazy="raise")

    __table_args__ = (
        CheckConstraint("total_amount >= 0", name="ck_orders_total_nonneg"),
        Index("ix_orders_user_id_status", "user_id", "status"),
        Index("ix_orders_laundry_id_status", "laundry_id", "status"),
        Index("ix_orders_scheduled_at", "scheduled_at"),
    )
```

## Migration template

```python
"""create orders table

Revision ID: 20260315_create_orders
Revises: 20260310_create_users
Create Date: 2026-03-15
"""
from alembic import op
import sqlalchemy as sa

revision = "20260315_create_orders"
down_revision = "20260310_create_users"
branch_labels = None
depends_on = None


def upgrade() -> None:
    order_status = sa.Enum(
        "pending", "confirmed", "picked_up", "washing", "ready",
        "out_for_delivery", "delivered", "cancelled",
        name="order_status",
    )
    order_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "orders",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("laundry_id", sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey("laundries.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("status", order_status, nullable=False, server_default="pending"),
        sa.Column("total_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False, server_default="INR"),
        sa.Column("scheduled_at", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.TIMESTAMP(timezone=True)),
        sa.CheckConstraint("total_amount >= 0", name="ck_orders_total_nonneg"),
    )
    op.create_index("ix_orders_user_id_status", "orders", ["user_id", "status"])
    op.create_index("ix_orders_laundry_id_status", "orders", ["laundry_id", "status"])
    op.create_index("ix_orders_scheduled_at", "orders", ["scheduled_at"])


def downgrade() -> None:
    op.drop_index("ix_orders_scheduled_at", table_name="orders")
    op.drop_index("ix_orders_laundry_id_status", table_name="orders")
    op.drop_index("ix_orders_user_id_status", table_name="orders")
    op.drop_table("orders")
    sa.Enum(name="order_status").drop(op.get_bind(), checkfirst=True)
```

## Repository template

```python
# app/repositories/order_repo.py
from __future__ import annotations

from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.order import Order, OrderStatus
from app.core.exceptions import OrderNotFoundError


class OrderRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get(self, order_id: UUID) -> Order:
        stmt = (
            select(Order)
            .where(Order.id == order_id, Order.deleted_at.is_(None))
            .options(selectinload(Order.laundry))
        )
        res = await self.session.execute(stmt)
        order = res.scalar_one_or_none()
        if order is None:
            raise OrderNotFoundError()
        return order

    async def list_for_user(
        self,
        *,
        user_id: UUID,
        status: OrderStatus | None,
        page: int,
        page_size: int,
    ) -> tuple[list[Order], int]:
        base = select(Order).where(Order.user_id == user_id, Order.deleted_at.is_(None))
        if status is not None:
            base = base.where(Order.status == status)
        total = await self.session.scalar(select(func.count()).select_from(base.subquery()))
        rows = await self.session.execute(
            base.order_by(Order.created_at.desc()).limit(page_size).offset((page - 1) * page_size)
        )
        return list(rows.scalars().all()), int(total or 0)

    async def add(self, order: Order) -> Order:
        self.session.add(order)
        await self.session.flush()
        return order

    async def update_status(self, order: Order, new_status: OrderStatus) -> Order:
        order.status = new_status
        await self.session.flush()
        return order
```

## Checklist

- [ ] UUID PK with `gen_random_uuid()`
- [ ] `created_at`, `updated_at`, `deleted_at` (where applicable)
- [ ] All FKs indexed; explicit `ondelete`
- [ ] Native Postgres enum for finite statuses
- [ ] Compound indexes match service queries
- [ ] `selectinload` / `joinedload` used to avoid N+1
- [ ] `lazy="raise"` for relationships to catch accidental lazy loads
- [ ] Migration up + down both work on fresh DB

## Forbidden

❌ `lazy="select"` (the default) on hot relationships — use `raise` + explicit loading
❌ Implicit autoflush traps — keep flushes intentional
❌ Long transactions
❌ Storing JSONB blobs for structured queryable data
