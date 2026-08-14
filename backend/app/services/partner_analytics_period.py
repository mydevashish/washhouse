"""IST period bounds and chart buckets for partner dashboard overview."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, time, timedelta
from enum import StrEnum
from zoneinfo import ZoneInfo

IST = ZoneInfo("Asia/Kolkata")


class PartnerOverviewPeriod(StrEnum):
    today = "today"
    week = "week"
    month = "month"


@dataclass(frozen=True, slots=True)
class ChartBucketDef:
    bucket_label: str
    bucket_start_utc: datetime
    bucket_end_utc: datetime


@dataclass(frozen=True, slots=True)
class PartnerOverviewPeriodBounds:
    period: PartnerOverviewPeriod
    period_label_ist: str
    period_start_utc: datetime
    period_end_utc: datetime
    chart_buckets: tuple[ChartBucketDef, ...]


def _as_ist(now: datetime) -> datetime:
    if now.tzinfo is None:
        return now.replace(tzinfo=IST)
    return now.astimezone(IST)


def _month_end_ist(year: int, month: int) -> datetime:
    if month == 12:
        return datetime(year + 1, 1, 1, tzinfo=IST)
    return datetime(year, month + 1, 1, tzinfo=IST)


def _format_period_label(period: PartnerOverviewPeriod, start_ist: datetime, now_ist: datetime) -> str:
    day = now_ist.date()
    if period == PartnerOverviewPeriod.today:
        return f"Today ({day.strftime('%d %b %Y')}, IST)"
    if period == PartnerOverviewPeriod.week:
        week_end = start_ist.date() + timedelta(days=6)
        return (
            f"This week ({start_ist.date().strftime('%d %b')}–"
            f"{week_end.strftime('%d %b %Y')}, IST)"
        )
    month_name = start_ist.strftime("%B %Y")
    return f"This month ({month_name}, IST)"


def _build_chart_buckets(
    period: PartnerOverviewPeriod,
    start_ist: datetime,
    end_ist: datetime,
) -> tuple[ChartBucketDef, ...]:
    buckets: list[ChartBucketDef] = []
    if period == PartnerOverviewPeriod.today:
        cursor = start_ist
        while cursor < end_ist:
            nxt = cursor + timedelta(hours=1)
            label = cursor.strftime("%H:%M")
            buckets.append(
                ChartBucketDef(
                    bucket_label=label,
                    bucket_start_utc=cursor.astimezone(UTC),
                    bucket_end_utc=nxt.astimezone(UTC),
                ),
            )
            cursor = nxt
        return tuple(buckets)

    cursor_date = start_ist.date()
    end_date = end_ist.date()
    while cursor_date < end_date:
        day_start = datetime.combine(cursor_date, time.min, tzinfo=IST)
        day_end = day_start + timedelta(days=1)
        if period == PartnerOverviewPeriod.week:
            label = day_start.strftime("%a %d %b")
        else:
            label = day_start.strftime("%d %b")
        buckets.append(
            ChartBucketDef(
                bucket_label=label,
                bucket_start_utc=day_start.astimezone(UTC),
                bucket_end_utc=day_end.astimezone(UTC),
            ),
        )
        cursor_date += timedelta(days=1)
    return tuple(buckets)


def resolve_partner_overview_period(
    period: PartnerOverviewPeriod,
    *,
    now: datetime | None = None,
) -> PartnerOverviewPeriodBounds:
    """Resolve IST calendar bounds and chart bucket grid for the overview API."""
    now_ist = _as_ist(now or datetime.now(IST))
    today = now_ist.date()

    if period == PartnerOverviewPeriod.today:
        start_ist = datetime.combine(today, time.min, tzinfo=IST)
        end_ist = start_ist + timedelta(days=1)
    elif period == PartnerOverviewPeriod.week:
        monday = today - timedelta(days=today.weekday())
        start_ist = datetime.combine(monday, time.min, tzinfo=IST)
        end_ist = start_ist + timedelta(days=7)
    elif period == PartnerOverviewPeriod.month:
        start_ist = datetime.combine(today.replace(day=1), time.min, tzinfo=IST)
        end_ist = _month_end_ist(today.year, today.month)
    else:
        raise ValueError(f"Unsupported period: {period}")

    label = _format_period_label(period, start_ist, now_ist)
    chart_buckets = _build_chart_buckets(period, start_ist, end_ist)
    return PartnerOverviewPeriodBounds(
        period=period,
        period_label_ist=label,
        period_start_utc=start_ist.astimezone(UTC),
        period_end_utc=end_ist.astimezone(UTC),
        chart_buckets=chart_buckets,
    )


def parse_partner_overview_period(raw: str) -> PartnerOverviewPeriod:
    try:
        return PartnerOverviewPeriod(raw.strip().lower())
    except ValueError as exc:
        from app.core.exceptions import ValidationError

        raise ValidationError("period must be one of: today, week, month") from exc


class PartnerDashboardPeriod(StrEnum):
    """Chart/donut/services/payments period for GET /partner/analytics/dashboard."""

    today = "today"
    week = "week"
    month = "month"
    year = "year"


@dataclass(frozen=True, slots=True)
class PartnerDashboardPeriodBounds:
    period: PartnerDashboardPeriod
    period_label_ist: str
    period_start_utc: datetime
    period_end_utc: datetime
    previous_start_utc: datetime
    previous_end_utc: datetime
    chart_buckets: tuple[ChartBucketDef, ...]
    previous_chart_buckets: tuple[ChartBucketDef, ...]


def parse_partner_dashboard_period(raw: str) -> PartnerDashboardPeriod:
    try:
        return PartnerDashboardPeriod(raw.strip().lower())
    except ValueError as exc:
        from app.core.exceptions import ValidationError

        raise ValidationError("period must be one of: today, week, month, year") from exc


def _format_dashboard_period_label(
    period: PartnerDashboardPeriod,
    start_ist: datetime,
    now_ist: datetime,
) -> str:
    if period == PartnerDashboardPeriod.today:
        return _format_period_label(PartnerOverviewPeriod.today, start_ist, now_ist)
    if period == PartnerDashboardPeriod.week:
        return _format_period_label(PartnerOverviewPeriod.week, start_ist, now_ist)
    if period == PartnerDashboardPeriod.month:
        return _format_period_label(PartnerOverviewPeriod.month, start_ist, now_ist)
    return f"This year ({start_ist.year}, IST)"


def _month_week_buckets(start_ist: datetime, end_ist: datetime) -> tuple[ChartBucketDef, ...]:
    """W1-W5: 7-day slices from the 1st; trailing weeks may be empty."""
    buckets: list[ChartBucketDef] = []
    for week_i in range(5):
        week_start = start_ist + timedelta(days=week_i * 7)
        if week_start >= end_ist:
            buckets.append(
                ChartBucketDef(
                    bucket_label=f"W{week_i + 1}",
                    bucket_start_utc=end_ist.astimezone(UTC),
                    bucket_end_utc=end_ist.astimezone(UTC),
                ),
            )
            continue
        week_end = min(week_start + timedelta(days=7), end_ist)
        buckets.append(
            ChartBucketDef(
                bucket_label=f"W{week_i + 1}",
                bucket_start_utc=week_start.astimezone(UTC),
                bucket_end_utc=week_end.astimezone(UTC),
            ),
        )
    return tuple(buckets)


def _year_month_buckets(year: int) -> tuple[ChartBucketDef, ...]:
    buckets: list[ChartBucketDef] = []
    for month in range(1, 13):
        start = datetime(year, month, 1, tzinfo=IST)
        end = _month_end_ist(year, month)
        buckets.append(
            ChartBucketDef(
                bucket_label=start.strftime("%b"),
                bucket_start_utc=start.astimezone(UTC),
                bucket_end_utc=end.astimezone(UTC),
            ),
        )
    return tuple(buckets)


def _dashboard_current_window(
    period: PartnerDashboardPeriod,
    now_ist: datetime,
) -> tuple[datetime, datetime]:
    today = now_ist.date()
    if period == PartnerDashboardPeriod.today:
        start_ist = datetime.combine(today, time.min, tzinfo=IST)
        return start_ist, start_ist + timedelta(days=1)
    if period == PartnerDashboardPeriod.week:
        monday = today - timedelta(days=today.weekday())
        start_ist = datetime.combine(monday, time.min, tzinfo=IST)
        return start_ist, start_ist + timedelta(days=7)
    if period == PartnerDashboardPeriod.month:
        start_ist = datetime.combine(today.replace(day=1), time.min, tzinfo=IST)
        return start_ist, _month_end_ist(today.year, today.month)
    start_ist = datetime(today.year, 1, 1, tzinfo=IST)
    return start_ist, datetime(today.year + 1, 1, 1, tzinfo=IST)


def _dashboard_previous_window(
    period: PartnerDashboardPeriod,
    start_ist: datetime,
) -> tuple[datetime, datetime]:
    if period == PartnerDashboardPeriod.today:
        prev_start = start_ist - timedelta(days=1)
        return prev_start, start_ist
    if period == PartnerDashboardPeriod.week:
        prev_start = start_ist - timedelta(days=7)
        return prev_start, start_ist
    if period == PartnerDashboardPeriod.month:
        prev_month_end = start_ist
        if start_ist.month == 1:
            prev_start = datetime(start_ist.year - 1, 12, 1, tzinfo=IST)
        else:
            prev_start = datetime(start_ist.year, start_ist.month - 1, 1, tzinfo=IST)
        return prev_start, prev_month_end
    prev_start = datetime(start_ist.year - 1, 1, 1, tzinfo=IST)
    return prev_start, start_ist


def _dashboard_chart_buckets(
    period: PartnerDashboardPeriod,
    start_ist: datetime,
    end_ist: datetime,
) -> tuple[ChartBucketDef, ...]:
    if period == PartnerDashboardPeriod.today:
        return _build_chart_buckets(PartnerOverviewPeriod.today, start_ist, end_ist)
    if period == PartnerDashboardPeriod.week:
        buckets: list[ChartBucketDef] = []
        cursor = start_ist
        while cursor < end_ist:
            nxt = cursor + timedelta(days=1)
            buckets.append(
                ChartBucketDef(
                    bucket_label=cursor.strftime("%a"),
                    bucket_start_utc=cursor.astimezone(UTC),
                    bucket_end_utc=nxt.astimezone(UTC),
                ),
            )
            cursor = nxt
        return tuple(buckets)
    if period == PartnerDashboardPeriod.month:
        return _month_week_buckets(start_ist, end_ist)
    return _year_month_buckets(start_ist.year)


def resolve_partner_dashboard_period(
    period: PartnerDashboardPeriod,
    *,
    now: datetime | None = None,
) -> PartnerDashboardPeriodBounds:
    """IST bounds + current/previous chart grids for the live dashboard API."""
    now_ist = _as_ist(now or datetime.now(IST))
    start_ist, end_ist = _dashboard_current_window(period, now_ist)
    prev_start_ist, prev_end_ist = _dashboard_previous_window(period, start_ist)
    return PartnerDashboardPeriodBounds(
        period=period,
        period_label_ist=_format_dashboard_period_label(period, start_ist, now_ist),
        period_start_utc=start_ist.astimezone(UTC),
        period_end_utc=end_ist.astimezone(UTC),
        previous_start_utc=prev_start_ist.astimezone(UTC),
        previous_end_utc=prev_end_ist.astimezone(UTC),
        chart_buckets=_dashboard_chart_buckets(period, start_ist, end_ist),
        previous_chart_buckets=_dashboard_chart_buckets(period, prev_start_ist, prev_end_ist),
    )


def resolve_dashboard_kpi_windows(*, now: datetime | None = None) -> dict[str, tuple[datetime, datetime]]:
    """Today / yesterday / week / prev week / month / prev month IST windows (UTC)."""
    now_ist = _as_ist(now or datetime.now(IST))
    today = resolve_partner_overview_period(PartnerOverviewPeriod.today, now=now_ist)
    yesterday_now = now_ist - timedelta(days=1)
    yesterday = resolve_partner_overview_period(PartnerOverviewPeriod.today, now=yesterday_now)
    week = resolve_partner_overview_period(PartnerOverviewPeriod.week, now=now_ist)
    prev_week_now = now_ist - timedelta(days=7)
    prev_week = resolve_partner_overview_period(PartnerOverviewPeriod.week, now=prev_week_now)
    month = resolve_partner_overview_period(PartnerOverviewPeriod.month, now=now_ist)
    prev_month_now = month.period_start_utc.astimezone(IST) - timedelta(seconds=1)
    prev_month = resolve_partner_overview_period(PartnerOverviewPeriod.month, now=prev_month_now)
    return {
        "today": (today.period_start_utc, today.period_end_utc),
        "yesterday": (yesterday.period_start_utc, yesterday.period_end_utc),
        "week": (week.period_start_utc, week.period_end_utc),
        "prev_week": (prev_week.period_start_utc, prev_week.period_end_utc),
        "month": (month.period_start_utc, month.period_end_utc),
        "prev_month": (prev_month.period_start_utc, prev_month.period_end_utc),
    }


def local_bucket_key(ts: datetime, *, granularity: str) -> datetime:
    """Normalize a UTC timestamptz to IST truncated bucket start (naive local for grouping keys)."""
    local = ts.astimezone(IST)
    if granularity == "hour":
        return local.replace(minute=0, second=0, microsecond=0, tzinfo=None)
    return local.replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=None)


def bucket_key_from_def(bucket: ChartBucketDef, *, granularity: str) -> datetime:
    local = bucket.bucket_start_utc.astimezone(IST)
    if granularity == "hour":
        return local.replace(minute=0, second=0, microsecond=0, tzinfo=None)
    return local.replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=None)


def ist_sql_bucket_key(raw: datetime, *, granularity: str) -> datetime:
    """Normalize PostgreSQL date_trunc(…, timezone('Asia/Kolkata', …)) to chart lookup keys."""
    if raw.tzinfo is not None:
        local = raw.astimezone(IST).replace(tzinfo=None)
    else:
        local = raw
    if granularity == "hour":
        return local.replace(minute=0, second=0, microsecond=0)
    return local.replace(hour=0, minute=0, second=0, microsecond=0)
