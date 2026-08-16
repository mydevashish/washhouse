"""IST calendar bounds for partner order list / export filters."""

from __future__ import annotations

from datetime import UTC, date, datetime, time, timedelta

from app.services.partner_analytics_period import IST


def resolve_ist_created_at_bounds(
    date_from: date | None,
    date_to: date | None,
) -> tuple[datetime | None, datetime | None]:
    """Return UTC bounds ``[start, end)`` for ``Order.created_at`` by inclusive IST days."""
    start_utc: datetime | None = None
    end_utc: datetime | None = None

    if date_from is not None:
        start_ist = datetime.combine(date_from, time.min, tzinfo=IST)
        start_utc = start_ist.astimezone(UTC)

    if date_to is not None:
        end_ist = datetime.combine(date_to, time.min, tzinfo=IST) + timedelta(days=1)
        end_utc = end_ist.astimezone(UTC)

    return start_utc, end_utc
