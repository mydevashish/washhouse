# Runbook — Outbound email (SMTP)

## Purpose

WashHouse sends email for:

| Flow | Behavior when SMTP unset |
| ---- | ------------------------ |
| Marketing contact / franchise | Lead **saved to DB**; support notify skipped (warning log) |
| Forgot password | **503** `EMAIL_NOT_CONFIGURED` unless `OTP_DEBUG=true` (local) |
| Announcement `channel_email` | Still stubbed (logs only; bulk sender TBD) |

## Required env

Set on the API service (Railway / local `backend/.env`):

| Variable | Notes |
| -------- | ----- |
| `SMTP_HOST` | Provider hostname |
| `SMTP_PORT` | `587` (STARTTLS) or `465` (SSL). Empty string → treated as unset. |
| `SMTP_USERNAME` | Optional for open relays; if set, `SMTP_PASSWORD` is required |
| `SMTP_PASSWORD` | Never log this value |
| `SMTP_FROM_EMAIL` | Verified sender address |
| `SMTP_USE_TLS` | Optional override; default STARTTLS when not SSL |
| `SMTP_USE_SSL` | Optional; auto-true when port is `465` |
| `SUPPORT_EMAIL` | Contact/franchise notify inbox (defaults to `SMTP_FROM_EMAIL`) |

## Verify locally

1. Set SMTP vars (Mailtrap / Gmail app password / SES SMTP).
2. Restart uvicorn.
3. `POST /api/v1/marketing/contact` → expect `201` and a support inbox message.
4. `POST /api/v1/auth/password/forgot` with a real user email → reset code arrives (or `otp_debug` when `OTP_DEBUG=true`).

## Common failures

| Symptom | Fix |
| ------- | --- |
| `503 EMAIL_NOT_CONFIGURED` | Set `SMTP_HOST` + `SMTP_PORT` (+ auth). Empty `SMTP_PORT=` counts as unset. |
| `502 EMAIL_DELIVERY_FAILED` | Check host/port, TLS mode (465 vs 587), credentials, FROM domain auth |
| Contact `201` but no mail | Check logs for `marketing.contact_email.skipped_not_configured` or `.failed` |
| Startup `ValueError` on Settings | Host without port, both TLS+SSL true, or username without password |

## Logs (no secrets)

- `email.send.start` / `email.send.ok` / `email.send.failed`
- `marketing.contact_email.ok` / `.skipped_not_configured` / `.failed`
- `auth.password_reset_email.ok` / `.failed`

Recipients are masked (`a***@example.com`). Passwords are never logged.
