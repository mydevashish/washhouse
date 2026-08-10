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
