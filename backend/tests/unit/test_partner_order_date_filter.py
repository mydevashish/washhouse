"""Unit tests for IST order date filter bounds."""

from __future__ import annotations

from datetime import UTC, date, datetime

from app.services.partner_order_date_filter import resolve_ist_created_at_bounds


def test_august_range_excludes_july_late_night_ist() -> None:
    start, end = resolve_ist_created_at_bounds(date(2026, 8, 1), date(2026, 8, 31))
    assert start == datetime(2026, 7, 31, 18, 30, tzinfo=UTC)
    assert end == datetime(2026, 8, 31, 18, 30, tzinfo=UTC)

    july_late = datetime(2026, 7, 31, 18, 0, tzinfo=UTC)  # 31 Jul 23:30 IST
    aug_early = datetime(2026, 7, 31, 19, 0, tzinfo=UTC)  # 1 Aug 00:30 IST

    assert not (july_late >= start and july_late < end)
    assert aug_early >= start and aug_early < end


def test_single_day_july_31_inclusive() -> None:
    start, end = resolve_ist_created_at_bounds(date(2026, 7, 31), date(2026, 7, 31))
    assert start == datetime(2026, 7, 30, 18, 30, tzinfo=UTC)
    assert end == datetime(2026, 7, 31, 18, 30, tzinfo=UTC)

    july_late = datetime(2026, 7, 31, 18, 0, tzinfo=UTC)
    aug_early = datetime(2026, 7, 31, 19, 0, tzinfo=UTC)

    assert july_late >= start and july_late < end
    assert not (aug_early >= start and aug_early < end)
