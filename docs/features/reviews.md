# Feature: Reviews and ratings

> Status: planned  
> Last updated: 2026-06-01

## API surface

| Method | Path | Purpose | Auth |
| ------ | ---- | ------- | ---- |
| POST | `/api/v1/laundries/{id}/reviews` | Create (verified order) | customer |
| GET | `/api/v1/laundries/{id}/reviews` | List paginated | public |

## Data model

- `reviews`: rating 1–5, comment, order_id (unique per order)

## Acceptance criteria

- [ ] Only `delivered` orders can review
- [ ] One review per order
