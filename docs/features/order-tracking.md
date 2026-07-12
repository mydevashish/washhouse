# Feature: Order tracking

> Status: **shipped** (WebSocket + polling fallback)  
> Owner: backend-architect + frontend-architect  
> Last updated: 2026-06-02

## Problem

Customers need real-time visibility from confirmation through delivery.

## Status machine

`confirmed` → `pickup_assigned` → `picked_up` → `washing` → `ironing` → `ready` → `out_for_delivery` → `delivered`  
Terminal: `cancelled`

## API surface

| Method | Path | Purpose | Auth |
| ------ | ---- | ------- | ---- |
| GET | `/api/v1/orders` | My orders | customer |
| GET | `/api/v1/orders/{id}` | Order + timeline events | customer |
| GET | `/api/v1/orders/{id}/events` | Status timeline only | customer |
| WS | `/api/v1/ws/orders/{id}?token=` | Live updates | customer |

## Data model

- `order_status_events` append-only

## Acceptance criteria

- [x] WebSocket push on partner status change (Redis pub/sub)
- [x] Auto-reconnect + ping/pong health check
- [x] Polling fallback every 30s if WebSocket unavailable
- [x] React Query cache updates without page refresh
- [ ] Partner status updates visible within 5s (p95) — measure in staging

## Architecture

See [`../architecture/order-tracking-websocket.md`](../architecture/order-tracking-websocket.md).
