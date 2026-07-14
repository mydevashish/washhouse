"""Marketing public API tests."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal
from unittest.mock import patch
from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import hash_password
from app.models.enums import LaundryStatus, OrderStatus, PaymentStatus, ReviewStatus, UserRole
from app.models.laundry import Laundry, LaundryService
from app.models.marketing import MarketingSiteStats, MarketingTestimonial
from app.models.order import Order, OrderItem
from app.models.review import Review
from app.models.user import User

pytestmark = pytest.mark.asyncio


@pytest.fixture(autouse=True)
def _disable_redis_rate_limit_middleware():
    """Avoid Redis/event-loop conflicts in middleware during API tests."""
    with patch.object(settings, "RATE_LIMIT_ENABLED", False):
        yield


CONTACT_PAYLOAD = {
    "name": "Test User",
    "phone": "+919876543210",
    "email": "marketing.test@example.com",
    "subject": "general",
    "message": "I would like to know more about WashHouse services in my area.",
}

FRANCHISE_PAYLOAD = {
    "name": "Franchise Applicant",
    "phone": "+919876543211",
    "email": "franchise.test@example.com",
    "city": "Bengaluru",
    "investment_range": "25-50",
    "message": "I am interested in opening a WashHouse franchise in Bengaluru.",
}


async def _seed_stats_context(session: AsyncSession) -> None:
    customer = User(
        email=f"marketing.stats.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password("Customer@1234"),
        full_name="Stats Customer",
        role=UserRole.customer,
        is_email_verified=True,
    )
    partner = User(
        email=f"marketing.partner.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password("Partner@1234"),
        full_name="Stats Partner",
        role=UserRole.partner,
        is_email_verified=True,
    )
    session.add_all([customer, partner])
    await session.flush()

    laundry_a = Laundry(
        owner_user_id=partner.id,
        name="Stats Laundry A",
        slug=f"stats-a-{uuid4().hex[:8]}",
        city="Bengaluru",
        address_line="1 Stats Road",
        status=LaundryStatus.approved,
        is_verified=True,
    )
    laundry_b = Laundry(
        owner_user_id=partner.id,
        name="Stats Laundry B",
        slug=f"stats-b-{uuid4().hex[:8]}",
        city="Mumbai",
        address_line="2 Stats Road",
        status=LaundryStatus.approved,
        is_verified=True,
    )
    session.add_all([laundry_a, laundry_b])
    await session.flush()

    service = LaundryService(
        laundry_id=laundry_a.id,
        name="Wash & Fold",
        category="wash",
        unit="kg",
        price_inr=Decimal("100"),
        is_active=True,
        catalog_status="active",
    )
    session.add(service)
    await session.flush()

    now = datetime.now(UTC)
    order = Order(
        user_id=customer.id,
        laundry_id=laundry_a.id,
        status=OrderStatus.delivered,
        tracking_code=f"WH-{uuid4().hex[:8].upper()}",
        pickup_at=now,
        delivery_at=now + timedelta(days=1),
        subtotal_inr=Decimal("700"),
        total_inr=Decimal("700"),
        payment_status=PaymentStatus.paid,
    )
    session.add(order)
    await session.flush()

    session.add(
        OrderItem(
            order_id=order.id,
            service_id=service.id,
            service_name=service.name,
            quantity=7,
            unit_price_inr=Decimal("100"),
            line_total_inr=Decimal("700"),
        ),
    )
    session.add(
        Review(
            laundry_id=laundry_a.id,
            user_id=customer.id,
            order_id=order.id,
            rating=5,
            comment="Great service",
            status=ReviewStatus.published,
        ),
    )
    await session.flush()


async def test_submit_contact_success(client: AsyncClient) -> None:
    response = await client.post("/api/v1/marketing/contact", json=CONTACT_PAYLOAD)

    assert response.status_code == 201
    body = response.json()["data"]
    assert body["status"] == "received"
    assert "id" in body


async def test_submit_contact_rejects_invalid_phone(client: AsyncClient) -> None:
    payload = {**CONTACT_PAYLOAD, "phone": "12345"}
    response = await client.post("/api/v1/marketing/contact", json=payload)

    assert response.status_code == 422


async def test_submit_contact_rejects_short_message(client: AsyncClient) -> None:
    payload = {**CONTACT_PAYLOAD, "message": "too short"}
    response = await client.post("/api/v1/marketing/contact", json=payload)

    assert response.status_code == 422


async def test_submit_contact_rate_limited_by_phone(client: AsyncClient) -> None:
    for _ in range(3):
        response = await client.post("/api/v1/marketing/contact", json=CONTACT_PAYLOAD)
        assert response.status_code == 201

    response = await client.post("/api/v1/marketing/contact", json=CONTACT_PAYLOAD)
    assert response.status_code == 429
    assert response.json()["error"]["code"] == "RATE_LIMITED"


async def test_submit_franchise_inquiry_success(client: AsyncClient) -> None:
    response = await client.post("/api/v1/marketing/franchise-inquiries", json=FRANCHISE_PAYLOAD)

    assert response.status_code == 201
    body = response.json()["data"]
    assert body["status"] == "received"
    assert "id" in body


async def test_get_marketing_stats_empty(client: AsyncClient) -> None:
    response = await client.get("/api/v1/marketing/stats")

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["happy_customers"] == 0
    assert data["cities_covered"] == 0
    assert data["pickup_points"] == 0
    assert data["garments_cleaned"] == 0
    assert data["avg_review_rating"] is None


async def test_get_marketing_stats_aggregates_from_db(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    await _seed_stats_context(db_session)

    response = await client.get("/api/v1/marketing/stats")

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["happy_customers"] == 1
    assert data["cities_covered"] == 2
    assert data["pickup_points"] == 2
    assert data["garments_cleaned"] == 7
    assert data["avg_review_rating"] == 5.0
    assert data["customer_satisfaction_percent"] == 100


async def test_get_marketing_stats_uses_singleton_overrides(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    db_session.add(
        MarketingSiteStats(
            singleton_key="default",
            happy_customers_override=5000,
            cities_covered_override=50,
        ),
    )
    await db_session.flush()

    response = await client.get("/api/v1/marketing/stats")

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["happy_customers"] == 5000
    assert data["cities_covered"] == 50


async def test_list_marketing_testimonials_empty(client: AsyncClient) -> None:
    response = await client.get("/api/v1/marketing/testimonials")

    assert response.status_code == 200
    assert response.json()["data"] == []


async def test_list_marketing_testimonials_featured_only(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    db_session.add_all(
        [
            MarketingTestimonial(
                name="Priya Sharma",
                location="Koramangala, Bengaluru",
                rating=5,
                text="Excellent pickup and delivery every week.",
                avatar_url="https://example.com/priya.jpg",
                is_featured=True,
                sort_order=1,
                is_active=True,
            ),
            MarketingTestimonial(
                name="Hidden User",
                location="Pune",
                rating=4,
                text="Should not appear",
                avatar_url="https://example.com/hidden.jpg",
                is_featured=False,
                sort_order=0,
                is_active=True,
            ),
        ],
    )
    await db_session.flush()

    response = await client.get("/api/v1/marketing/testimonials?limit=6")

    assert response.status_code == 200
    items = response.json()["data"]
    assert len(items) == 1
    assert items[0]["name"] == "Priya Sharma"
    assert items[0]["avatarUrl"] == "https://example.com/priya.jpg"
    assert items[0]["isFeatured"] is True
