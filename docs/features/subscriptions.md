# Feature: Subscriptions

> Status: planned  
> Last updated: 2026-06-01

See [ADR-002](../decisions/ADR-002-subscription-billing.md).

## Plans (seed)

| Slug | Name | Interval |
| ---- | ---- | -------- |
| student | Student Plan | monthly |
| bachelor | Bachelor Plan | monthly |
| family | Family Plan | monthly |
| monthly_ironing | Monthly Ironing | monthly |

## API surface

| Method | Path | Purpose | Auth |
| ------ | ---- | ------- | ---- |
| GET | `/api/v1/subscription-plans` | Catalog | public |
| POST | `/api/v1/subscriptions` | Subscribe | customer |
| GET | `/api/v1/subscriptions/me` | Active | customer |
| POST | `/api/v1/subscriptions/cancel` | Cancel | customer |
