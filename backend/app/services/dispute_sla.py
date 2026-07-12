"""Dispute SLA calculations and status."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Literal

from app.models.enums import ComplaintStatus, DisputePriority

SlaStatus = Literal["on_track", "at_risk", "breached", "met", "missed", "na"]

SLA_HOURS: dict[DisputePriority, int] = {
    DisputePriority.low: 72,
    DisputePriority.medium: 48,
    DisputePriority.high: 24,
    DisputePriority.critical: 4,
}

SLA_STATUS_LABELS: dict[SlaStatus, str] = {
    "on_track": "On Track",
    "at_risk": "At Risk",
    "breached": "Breached",
    "met": "Met",
    "missed": "Missed",
    "na": "N/A",
}

# Final 25% of the SLA window triggers "At Risk".
AT_RISK_FRACTION = 0.25

OPEN_SLA_STATUSES = (
    ComplaintStatus.open,
    ComplaintStatus.investigating,
    ComplaintStatus.awaiting_customer,
    ComplaintStatus.awaiting_partner,
    ComplaintStatus.escalated,
)

TERMINAL_SLA_STATUSES = (
    ComplaintStatus.resolved,
    ComplaintStatus.rejected,
    ComplaintStatus.closed,
)


@dataclass(frozen=True)
class DisputeSlaSnapshot:
    sla_hours: int
    sla_deadline_at: datetime
    sla_status: SlaStatus
    sla_status_label: str
    time_remaining_seconds: int
    overdue_seconds: int
    escalation_countdown_seconds: int
    is_breached: bool
    is_at_risk: bool

    def as_dict(self) -> dict:
        return {
            "sla_hours": self.sla_hours,
            "sla_deadline_at": self.sla_deadline_at,
            "sla_status": self.sla_status,
            "sla_status_label": self.sla_status_label,
            "time_remaining_seconds": self.time_remaining_seconds,
            "overdue_seconds": self.overdue_seconds,
            "escalation_countdown_seconds": self.escalation_countdown_seconds,
            "is_breached": self.is_breached,
            "is_at_risk": self.is_at_risk,
        }


def sla_hours_for(priority: DisputePriority, sla_map: dict[str, int] | None = None) -> int:
    if sla_map:
        key = priority.value if hasattr(priority, "value") else str(priority)
        if key in sla_map:
            return int(sla_map[key])
    return SLA_HOURS.get(priority, SLA_HOURS[DisputePriority.medium])


def sla_deadline(created_at: datetime, priority: DisputePriority, sla_map: dict[str, int] | None = None) -> datetime:
    hours = sla_hours_for(priority, sla_map)
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=UTC)
    return created_at + timedelta(hours=hours)


def at_risk_threshold(created_at: datetime, priority: DisputePriority, sla_map: dict[str, int] | None = None) -> datetime:
    hours = sla_hours_for(priority, sla_map)
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=UTC)
    elapsed_before_risk = hours * (1 - AT_RISK_FRACTION)
    return created_at + timedelta(hours=elapsed_before_risk)


def compute_dispute_sla(
    *,
    created_at: datetime,
    priority: DisputePriority,
    status: ComplaintStatus,
    resolved_at: datetime | None = None,
    now: datetime | None = None,
    sla_map: dict[str, int] | None = None,
) -> DisputeSlaSnapshot:
    now = now or datetime.now(UTC)
    if now.tzinfo is None:
        now = now.replace(tzinfo=UTC)

    hours = sla_hours_for(priority, sla_map)
    deadline = sla_deadline(created_at, priority, sla_map)
    risk_at = at_risk_threshold(created_at, priority, sla_map)

    if status in TERMINAL_SLA_STATUSES:
        end = resolved_at or now
        if end.tzinfo is None:
            end = end.replace(tzinfo=UTC)
        met = end <= deadline
        sla_status: SlaStatus = "met" if met else "missed"
        overdue = max(0, int((end - deadline).total_seconds()))
        return DisputeSlaSnapshot(
            sla_hours=hours,
            sla_deadline_at=deadline,
            sla_status=sla_status,
            sla_status_label=SLA_STATUS_LABELS[sla_status],
            time_remaining_seconds=0,
            overdue_seconds=overdue,
            escalation_countdown_seconds=0,
            is_breached=not met,
            is_at_risk=False,
        )

    remaining = int((deadline - now).total_seconds())
    overdue = max(0, -remaining)

    if remaining <= 0:
        sla_status = "breached"
    elif now >= risk_at:
        sla_status = "at_risk"
    else:
        sla_status = "on_track"

    return DisputeSlaSnapshot(
        sla_hours=hours,
        sla_deadline_at=deadline,
        sla_status=sla_status,
        sla_status_label=SLA_STATUS_LABELS[sla_status],
        time_remaining_seconds=max(0, remaining),
        overdue_seconds=overdue,
        escalation_countdown_seconds=max(0, remaining),
        is_breached=remaining <= 0,
        is_at_risk=sla_status == "at_risk",
    )


def is_auto_escalation_candidate(
    *,
    created_at: datetime,
    priority: DisputePriority,
    status: ComplaintStatus,
    now: datetime | None = None,
) -> bool:
    if status in TERMINAL_SLA_STATUSES or status == ComplaintStatus.escalated:
        return False
    snapshot = compute_dispute_sla(
        created_at=created_at,
        priority=priority,
        status=status,
        now=now,
    )
    return snapshot.is_breached
