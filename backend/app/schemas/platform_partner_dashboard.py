"""Platform partner dashboard schemas (read-only)."""

from __future__ import annotations

from pydantic import BaseModel, Field


class PlatformPartnerMetrics(BaseModel):
    total_revenue_inr: str
    platform_commission_inr: str
    active_customers: int
    active_laundries: int
    orders_total: int
    revenue_growth_pct: float | None = None
    orders_growth_pct: float | None = None


class PlatformPartnerChartPoint(BaseModel):
    date: str
    value: float
    label: str | None = None


class PlatformPartnerMonthPoint(BaseModel):
    month: str
    count: int


class PlatformPartnerCharts(BaseModel):
    revenue_trend: list[PlatformPartnerChartPoint] = Field(default_factory=list)
    orders_trend: list[PlatformPartnerChartPoint] = Field(default_factory=list)
    customer_growth: list[PlatformPartnerMonthPoint] = Field(default_factory=list)
    laundry_growth: list[PlatformPartnerMonthPoint] = Field(default_factory=list)


class PlatformPartnerTopLaundry(BaseModel):
    name: str
    city: str
    revenue_inr: str
    orders: int


class PlatformPartnerTopCity(BaseModel):
    city: str
    revenue_inr: str
    orders: int


class PlatformPartnerTopService(BaseModel):
    service_name: str
    revenue_inr: str
    quantity: int


class PlatformPartnerTables(BaseModel):
    top_laundries: list[PlatformPartnerTopLaundry] = Field(default_factory=list)
    top_cities: list[PlatformPartnerTopCity] = Field(default_factory=list)
    top_services: list[PlatformPartnerTopService] = Field(default_factory=list)


class PlatformPartnerDashboardResponse(BaseModel):
    metrics: PlatformPartnerMetrics
    charts: PlatformPartnerCharts
    tables: PlatformPartnerTables
    generated_at: str
