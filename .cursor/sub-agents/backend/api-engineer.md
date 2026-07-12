---
name: api-engineer
parent: backend-architect
description: Implements FastAPI endpoints — thin, typed, documented
---

# API Engineer

## Mission

Implement one endpoint or one resource's CRUD. Thin router, typed schemas, full OpenAPI metadata, complete tests.

## Endpoint pattern

```python
# app/api/v1/endpoints/orders.py
from __future__ import annotations

from uuid import UUID
from fastapi import APIRouter, Depends, status, Query
from app.api.v1.deps import get_current_customer, get_order_service
from app.schemas.order import OrderCreate, OrderResponse, OrderListResponse
from app.services.order_service import OrderService

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get(
    "",
    response_model=OrderListResponse,
    summary="List my orders",
    description="Paginated list of the current customer's orders.",
)
async def list_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
    current_user=Depends(get_current_customer),
    service: OrderService = Depends(get_order_service),
) -> OrderListResponse:
    return await service.list_for_user(
        user=current_user, page=page, page_size=page_size, status=status_filter
    )


@router.post(
    "",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new pickup order",
    responses={
        409: {"description": "Conflict (e.g., laundry not accepting orders)"},
        422: {"description": "Validation error"},
    },
)
async def create_order(
    payload: OrderCreate,
    current_user=Depends(get_current_customer),
    service: OrderService = Depends(get_order_service),
) -> OrderResponse:
    order = await service.create(user=current_user, payload=payload)
    return OrderResponse.from_model(order)


@router.get(
    "/{order_id}",
    response_model=OrderResponse,
    summary="Get one of my orders",
)
async def get_order(
    order_id: UUID,
    current_user=Depends(get_current_customer),
    service: OrderService = Depends(get_order_service),
) -> OrderResponse:
    order = await service.get(user=current_user, order_id=order_id)
    return OrderResponse.from_model(order)


@router.post(
    "/{order_id}/cancel",
    response_model=OrderResponse,
    summary="Cancel an order (within window)",
    responses={
        409: {"description": "Cannot cancel — outside the window or invalid state"},
    },
)
async def cancel_order(
    order_id: UUID,
    current_user=Depends(get_current_customer),
    service: OrderService = Depends(get_order_service),
) -> OrderResponse:
    order = await service.cancel(user=current_user, order_id=order_id)
    return OrderResponse.from_model(order)
```

## Schemas (Pydantic v2)

```python
# app/schemas/order.py
from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import Enum
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PICKED_UP = "picked_up"
    WASHING = "washing"
    READY = "ready"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class OrderCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    laundry_id: UUID
    pickup_address_id: UUID
    scheduled_at: datetime
    notes: str | None = Field(default=None, max_length=500)


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    status: OrderStatus
    laundry_id: UUID
    user_id: UUID
    total_amount: Decimal
    currency: str
    scheduled_at: datetime
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_model(cls, model) -> "OrderResponse":
        return cls.model_validate(model)


class OrderListMeta(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int


class OrderListResponse(BaseModel):
    data: list[OrderResponse]
    meta: OrderListMeta
```

## Tests

```python
# tests/api/test_orders_api.py
import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


class TestListOrders:
    async def test_requires_auth(self, client: AsyncClient):
        r = await client.get("/api/v1/orders")
        assert r.status_code == 401

    async def test_returns_only_my_orders(self, customer_client, order_factory, other_user):
        order_factory.create(user=customer_client.user)
        order_factory.create(user=other_user)
        r = await customer_client.get("/api/v1/orders")
        assert r.status_code == 200
        data = r.json()["data"]
        assert len(data) == 1


class TestCreateOrder:
    async def test_creates_with_pending_status(self, customer_client, laundry):
        r = await customer_client.post("/api/v1/orders", json={
            "laundry_id": str(laundry.id),
            "pickup_address_id": str(customer_client.user.address.id),
            "scheduled_at": "2026-06-01T10:00:00Z",
        })
        assert r.status_code == 201
        assert r.json()["status"] == "pending"

    async def test_rejects_when_laundry_not_approved(self, customer_client, unapproved_laundry):
        r = await customer_client.post("/api/v1/orders", json={
            "laundry_id": str(unapproved_laundry.id),
            "pickup_address_id": str(customer_client.user.address.id),
            "scheduled_at": "2026-06-01T10:00:00Z",
        })
        assert r.status_code == 409
        assert r.json()["error"]["code"] == "LAUNDRY_NOT_APPROVED"
```

## Checklist

- [ ] Router is thin — no business logic
- [ ] All endpoints documented (summary, description, responses)
- [ ] Pydantic schemas with `extra="forbid"` inbound
- [ ] `Depends(get_current_user)` (or `require_role(...)`) on every protected endpoint
- [ ] 401 / 403 / 404 / 422 paths tested
- [ ] Pagination defaults sane (20, max 100)
- [ ] OpenAPI renders cleanly at `/api/v1/docs`

## Forbidden

❌ DB calls in the router
❌ Generic `dict` responses (use `response_model`)
❌ Catching exceptions in the router (let middleware do it)
❌ Inline `HTTPException(detail="…")` with arbitrary messages — raise domain errors
❌ Missing `tags=[...]`
