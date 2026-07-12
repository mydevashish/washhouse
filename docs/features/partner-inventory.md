# Feature: Partner inventory

> Status: planned  
> Last updated: 2026-06-01

## Problem

Partners track cloth count and flag missing/damaged items per order.

## Data model

- `order_inventory`: order_id, expected_count, received_count, missing_notes, damaged_notes

## API surface

| Method | Path | Purpose | Auth |
| ------ | ---- | ------- | ---- |
| GET | `/api/v1/partner/orders/{id}/inventory` | Get | partner |
| PUT | `/api/v1/partner/orders/{id}/inventory` | Update | partner |
