# Feature: Authentication

> Status: in-progress  
> Owner: backend-architect + frontend-architect  
> Last updated: 2026-06-01

## Problem

Users need secure account access via email/password and OTP without exposing long-lived tokens to XSS.

## Persona

Customer, partner, admin — urban mobile users in India.

## User stories

- As a **customer**, I want to register with email/password, so that I can book laundry.
- As a **user**, I want OTP login via phone/email, so that I can sign in quickly.
- As a **user**, I want sessions to refresh safely, so that I stay logged in on mobile.

## Goals

- [x] Register + login (email/password)
- [ ] Refresh token rotation (httpOnly cookie)
- [ ] OTP email + phone
- [ ] Password reset
- [ ] Google OAuth (501 until `GOOGLE_CLIENT_ID`)

## Non-goals

- WhatsApp login as primary IdP (use OTP delivery channel only)

## API surface

| Method | Path | Purpose | Auth |
| ------ | ---- | ------- | ---- |
| POST | `/api/v1/auth/register` | Register | public |
| POST | `/api/v1/auth/login` | Login | public |
| POST | `/api/v1/auth/refresh` | Rotate refresh | cookie/body |
| POST | `/api/v1/auth/logout` | Revoke family | authenticated |
| POST | `/api/v1/auth/otp/send` | Send OTP | public |
| POST | `/api/v1/auth/otp/verify` | Verify OTP | public |
| POST | `/api/v1/auth/password/forgot` | Request reset | public |
| POST | `/api/v1/auth/password/reset` | Reset password | public |
| GET | `/api/v1/auth/google` | OAuth redirect | public (501 if unset) |

## Data model

- `users`, `refresh_tokens`, `otp_codes`, `audit_logs` (existing)

## Frontend surface

- Routes: `/login`, `/register`
- `frontend/services/auth.ts`, `frontend/store/auth.store.ts`
- Access token in Zustand memory; refresh in httpOnly cookie

## Acceptance criteria

- [ ] Refresh rotation detects reuse and revokes family
- [ ] OTP expires in 10 minutes, max 5 attempts/hour per destination
- [ ] Role `customer` | `partner` | `admin` on JWT claims
