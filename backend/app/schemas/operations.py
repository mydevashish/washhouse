"""Operations center API schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import TaskAssignmentType


class OperationsDashboardResponse(BaseModel):
    laundry_id: UUID
    laundry_name: str
    pickups_today: int
    deliveries_today: int
    todays_pickups: int
    todays_deliveries: int
    delayed_orders: int
    assigned_drivers: int
    active_drivers: int = 0
    pending_tasks: int
    failed_deliveries: int = 0
    avg_delivery_time_minutes: float | None
    completed_orders_today: int


class DriverSummaryResponse(BaseModel):
    staff_id: UUID
    name: str
    role: str
    role_label: str
    is_active: bool
    daily_capacity: int
    active_tasks: int
    completed_today: int
    workload_pct: float
    available: bool


class TaskAssignmentResponse(BaseModel):
    id: UUID
    staff_id: UUID
    staff_name: str
    status: str
    assigned_at: datetime
    started_at: datetime | None = None
    completed_at: datetime | None = None


class OperationsOrderRow(BaseModel):
    order_id: UUID
    tracking_code: str
    customer_name: str
    status: str
    pickup_at: datetime
    delivery_at: datetime
    total_inr: str
    is_delayed: bool
    assignment: TaskAssignmentResponse | None = None
    queue_status: str


class QueueBucketResponse(BaseModel):
    status: str
    label: str
    count: int
    orders: list[OperationsOrderRow]


class PickupQueueResponse(BaseModel):
    buckets: list[QueueBucketResponse]
    total: int


class DeliveryQueueResponse(BaseModel):
    buckets: list[QueueBucketResponse]
    total: int


class AssignDriverRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    order_id: UUID
    staff_id: UUID
    task_type: TaskAssignmentType
    notes: str | None = Field(default=None, max_length=500)


class ReassignDriverRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    staff_id: UUID
    notes: str | None = Field(default=None, max_length=500)


class UpdateAssignmentStatusRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: str
    notes: str | None = Field(default=None, max_length=500)
