# Feature: Customer discovery

> Status: planned  
> Owner: frontend-architect + backend-architect  
> Last updated: 2026-06-01

## Problem

Customers must find nearby laundries with ratings, price, and availability.

## UX flow

1. App requests location (or user picks city).
2. List laundries sorted by distance with filters.
3. Tap laundry → detail with services and reviews preview.

## API surface

| Method | Path | Purpose | Auth |
| ------ | ---- | ------- | ---- |
| GET | `/api/v1/laundries` | Search/list (lat, lng, radius, filters) | optional |
| GET | `/api/v1/laundries/{id}` | Detail + services | optional |
| GET | `/api/v1/laundries/{id}/reviews` | Review summary | optional |

## Data model

- `laundries`, `laundry_services`, `laundry_pricing`
- Indexes: `ix_laundries_city_is_approved`, lat/lng for haversine

## Frontend surface

- Route: `/discover`, `/discover/[id]`
- `frontend/features/laundries/`

## Acceptance criteria

- [ ] Debounced search 300ms
- [ ] Server pagination default 20
- [ ] Only `is_approved` laundries in public list
