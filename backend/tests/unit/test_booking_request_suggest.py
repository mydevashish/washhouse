"""Unit tests for booking-request laundry suggestion ranking (no DB)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal
from uuid import uuid4

from app.models.booking_request import BookingRequest
from app.models.enums import (
    BookingRequestCreatedByRole,
    BookingRequestPreferredTime,
    BookingRequestPriority,
    BookingRequestServiceType,
    BookingRequestSource,
    BookingRequestStatus,
    LaundryStatus,
)
from app.models.laundry import Laundry
from app.services.booking_request_service import BookingRequestService


def _request(*, city: str | None = "Bengaluru", pincode: str | None = "560034") -> BookingRequest:
    return BookingRequest(
        id=uuid4(),
        public_code="BR-TEST01",
        customer_name="Priya",
        phone_e164="+919876543210",
        service_type=BookingRequestServiceType.wash_fold,
        preferred_time_window=BookingRequestPreferredTime.morning,
        city=city,
        pincode=pincode,
        source=BookingRequestSource.marketing_home,
        status=BookingRequestStatus.new,
        priority=BookingRequestPriority.normal,
        created_by_role=BookingRequestCreatedByRole.public,
    )


def _laundry(
    *,
    name: str,
    city: str,
    address: str,
    rating: float,
    updated_hours_ago: float = 1.0,
) -> Laundry:
    laundry = Laundry(
        id=uuid4(),
        owner_user_id=uuid4(),
        name=name,
        slug=f"{name.lower().replace(' ', '-')}-{uuid4().hex[:6]}",
        city=city,
        address_line=address,
        status=LaundryStatus.approved,
        avg_rating=Decimal(str(rating)),
    )
    laundry.updated_at = datetime.now(UTC) - timedelta(hours=updated_hours_ago)
    return laundry


def test_score_prefers_pincode_city_over_higher_remote_rating() -> None:
    req = _request()
    local = _laundry(
        name="Local",
        city="Bengaluru",
        address="12 MG Road 560034",
        rating=3.0,
    )
    remote = _laundry(
        name="Remote",
        city="Mumbai",
        address="1 Marine Drive",
        rating=4.9,
    )
    local_s = BookingRequestService._score_laundry_suggestion(req, local)
    remote_s = BookingRequestService._score_laundry_suggestion(req, remote)
    assert local_s.score > remote_s.score
    assert local_s.reason == "pincode_match"


def test_score_falls_back_to_rating_and_recency_without_geo() -> None:
    req = _request(city=None, pincode=None)
    hot = _laundry(
        name="Hot",
        city="Pune",
        address="1 FC Road",
        rating=4.8,
        updated_hours_ago=2,
    )
    cold = _laundry(
        name="Cold",
        city="Pune",
        address="2 FC Road",
        rating=2.0,
        updated_hours_ago=200,
    )
    hot_s = BookingRequestService._score_laundry_suggestion(req, hot)
    cold_s = BookingRequestService._score_laundry_suggestion(req, cold)
    assert hot_s.score > cold_s.score
    assert hot_s.reason in {"highest_rated", "recently_active"}
