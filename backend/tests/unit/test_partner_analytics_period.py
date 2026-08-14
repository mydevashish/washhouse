"""Unit tests for partner dashboard IST period boundaries (no DB)."""

from __future__ import annotations

from datetime import UTC, datetime
from zoneinfo import ZoneInfo

import pytest

from app.services.partner_analytics_period import (
    IST,
    PartnerOverviewPeriod,
    parse_partner_overview_period,
    resolve_partner_overview_period,
)


def test_today_bounds_use_ist_midnight() -> None:
    # 10 Aug 2026 00:30 IST — still "today" in IST; UTC is still 9 Aug evening.
    now = datetime(2026, 8, 10, 0, 30, tzinfo=IST)
    bounds = resolve_partner_overview_period(PartnerOverviewPeriod.today, now=now)
    assert bounds.period_start_utc == datetime(2026, 8, 9, 18, 30, tzinfo=UTC)
    assert bounds.period_end_utc == datetime(2026, 8, 10, 18, 30, tzinfo=UTC)
    assert "10 Aug 2026" in bounds.period_label_ist
    assert len(bounds.chart_buckets) == 24


def test_order_created_2330_ist_vs_0030_ist_different_days() -> None:
    late_night = datetime(2026, 8, 9, 23, 30, tzinfo=IST)
    early_morning = datetime(2026, 8, 10, 0, 30, tzinfo=IST)

    day_a = resolve_partner_overview_period(PartnerOverviewPeriod.today, now=late_night)
    day_b = resolve_partner_overview_period(PartnerOverviewPeriod.today, now=early_morning)

    assert day_a.period_start_utc == datetime(2026, 8, 8, 18, 30, tzinfo=UTC)
    assert day_b.period_start_utc == datetime(2026, 8, 9, 18, 30, tzinfo=UTC)
    assert day_a.period_start_utc != day_b.period_start_utc


def test_week_starts_monday_ist() -> None:
    # Wednesday 12 Aug 2026
    now = datetime(2026, 8, 12, 15, 0, tzinfo=IST)
    bounds = resolve_partner_overview_period(PartnerOverviewPeriod.week, now=now)
    assert bounds.period_start_utc == datetime(2026, 8, 9, 18, 30, tzinfo=UTC)  # Mon 10 Aug 00:00 IST
    assert bounds.period_end_utc == datetime(2026, 8, 16, 18, 30, tzinfo=UTC)
    assert len(bounds.chart_buckets) == 7


def test_month_bounds_first_day_ist() -> None:
    now = datetime(2026, 8, 15, 12, 0, tzinfo=IST)
    bounds = resolve_partner_overview_period(PartnerOverviewPeriod.month, now=now)
    assert bounds.period_start_utc == datetime(2026, 7, 31, 18, 30, tzinfo=UTC)  # 1 Aug 00:00 IST
    assert bounds.period_end_utc == datetime(2026, 8, 31, 18, 30, tzinfo=UTC)
    assert len(bounds.chart_buckets) == 31


def test_dashboard_year_has_twelve_monthly_buckets() -> None:
    from app.services.partner_analytics_period import (
        PartnerDashboardPeriod,
        resolve_partner_dashboard_period,
    )

    now = datetime(2026, 8, 13, 12, 0, tzinfo=IST)
    bounds = resolve_partner_dashboard_period(PartnerDashboardPeriod.year, now=now)
    assert len(bounds.chart_buckets) == 12
    assert len(bounds.previous_chart_buckets) == 12
    assert bounds.chart_buckets[0].bucket_label == "Jan"
    assert bounds.chart_buckets[11].bucket_label == "Dec"
    assert bounds.period_start_utc == datetime(2025, 12, 31, 18, 30, tzinfo=UTC)
    assert bounds.previous_start_utc == datetime(2024, 12, 31, 18, 30, tzinfo=UTC)


def test_dashboard_month_uses_five_week_buckets() -> None:
    from app.services.partner_analytics_period import (
        PartnerDashboardPeriod,
        resolve_partner_dashboard_period,
    )

    now = datetime(2026, 8, 15, 12, 0, tzinfo=IST)
    bounds = resolve_partner_dashboard_period(PartnerDashboardPeriod.month, now=now)
    assert len(bounds.chart_buckets) == 5
    assert [b.bucket_label for b in bounds.chart_buckets] == ["W1", "W2", "W3", "W4", "W5"]
    assert len(bounds.previous_chart_buckets) == 5


def test_dashboard_today_ist_2330_vs_0030_different_days() -> None:
    from app.services.partner_analytics_period import (
        PartnerDashboardPeriod,
        resolve_partner_dashboard_period,
    )

    late_night = datetime(2026, 8, 9, 23, 30, tzinfo=IST)
    early_morning = datetime(2026, 8, 10, 0, 30, tzinfo=IST)
    day_a = resolve_partner_dashboard_period(PartnerDashboardPeriod.today, now=late_night)
    day_b = resolve_partner_dashboard_period(PartnerDashboardPeriod.today, now=early_morning)
    assert day_a.period_start_utc != day_b.period_start_utc
    assert len(day_a.chart_buckets) == 24
    assert len(day_a.previous_chart_buckets) == 24


def test_parse_dashboard_period_rejects_quarter() -> None:
    from app.core.exceptions import ValidationError
    from app.services.partner_analytics_period import parse_partner_dashboard_period

    with pytest.raises(ValidationError):
        parse_partner_dashboard_period("quarter")


def test_parse_overview_period_still_rejects_year() -> None:
    from app.core.exceptions import ValidationError

    with pytest.raises(ValidationError):
        parse_partner_overview_period("year")


def test_ist_sql_bucket_key_matches_bucket_def_for_day() -> None:
    from app.services.partner_analytics_period import (
        ChartBucketDef,
        bucket_key_from_def,
        ist_sql_bucket_key,
    )

    day_start_utc = datetime(2026, 8, 9, 18, 30, tzinfo=UTC)  # 10 Aug 2026 00:00 IST
    bucket_def = ChartBucketDef(
        bucket_label="10 Aug",
        bucket_start_utc=day_start_utc,
        bucket_end_utc=datetime(2026, 8, 10, 18, 30, tzinfo=UTC),
    )
    sql_bucket = datetime(2026, 8, 10, 0, 0, 0)  # naive IST from PG date_trunc
    assert ist_sql_bucket_key(sql_bucket, granularity="day") == bucket_key_from_def(
        bucket_def,
        granularity="day",
    )
