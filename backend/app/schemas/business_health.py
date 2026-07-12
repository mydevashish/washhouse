"""Executive business health dashboard schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field


class BusinessHealthMetrics(BaseModel):
    revenue_today_inr: str
    revenue_month_inr: str
    revenue_growth_pct: float | None = None
    orders_today: int
    orders_month: int
    order_growth_pct: float | None = None
    average_order_value_inr: str
    active_customers: int
    new_customers: int
    returning_customers: int
    active_laundries: int
    top_laundry_name: str | None = None
    top_laundry_revenue_inr: str | None = None
    lowest_laundry_name: str | None = None
    lowest_laundry_revenue_inr: str | None = None
    total_customers: int
    total_laundries: int


class BusinessHealthChartPoint(BaseModel):
    date: str
    value: float
    label: str | None = None


class BusinessHealthMonthPoint(BaseModel):
    month: str
    count: int


class BusinessHealthCharts(BaseModel):
    revenue_trend: list[BusinessHealthChartPoint] = Field(default_factory=list)
    orders_trend: list[BusinessHealthChartPoint] = Field(default_factory=list)
    customer_growth: list[BusinessHealthMonthPoint] = Field(default_factory=list)
    laundry_growth: list[BusinessHealthMonthPoint] = Field(default_factory=list)
    commission_trend: list[BusinessHealthChartPoint] = Field(default_factory=list)


class BusinessHealthOperational(BaseModel):
    open_disputes: int
    pending_refunds: int
    pending_settlements: int
    failed_deliveries: int
    delayed_orders: int
    delayed_settlements: int


class BusinessHealthGrowth(BaseModel):
    customer_growth_pct: float | None = None
    laundry_growth_pct: float | None = None
    order_growth_pct: float | None = None
    revenue_growth_pct: float | None = None
    new_customers_month: int
    new_laundries_month: int


class BusinessHealthAlert(BaseModel):
    id: str
    severity: str
    title: str
    description: str
    metric_value: str
    href: str


class BusinessHealthTrendPoint(BaseModel):
    date: str
    revenue_inr: str
    orders: int


class BusinessHealthDashboardResponse(BaseModel):
    metrics: BusinessHealthMetrics
    operational: BusinessHealthOperational
    growth: BusinessHealthGrowth
    alerts: list[BusinessHealthAlert] = Field(default_factory=list)
    trend: list[BusinessHealthTrendPoint] = Field(default_factory=list)
    charts: BusinessHealthCharts = Field(default_factory=BusinessHealthCharts)
    generated_at: str
