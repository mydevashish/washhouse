# Feature: Partner onboarding

> Status: planned  
> Last updated: 2026-06-01

## Problem

Laundry owners register and await admin approval before accepting orders.

## API surface

| Method | Path | Purpose | Auth |
| ------ | ---- | ------- | ---- |
| POST | `/api/v1/partner/laundries` | Register laundry + KYC | partner |
| GET | `/api/v1/partner/laundries/me` | Own laundry status | partner |

## Data model

- `laundries.status`: `pending_approval` | `approved` | `rejected` | `suspended`
- KYC: document URLs (Cloudinary), gstin optional

## Acceptance criteria

- [ ] Cannot accept orders until `approved`
