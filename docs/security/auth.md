# Authentication & Authorization

## Tokens

| Token   | TTL     | Storage                                  |
| ------- | ------- | ---------------------------------------- |
| Access  | 15 min  | Memory (browser) / Authorization header  |
| Refresh | 30 days | httpOnly Secure SameSite=Lax cookie      |

## Algorithms

- Prod: **RS256** (asymmetric)
- Dev: **HS256** acceptable

## Flow

1. **Register** → email verification email sent
2. **Login** → returns access token + sets refresh cookie
3. **Authorized request** → `Authorization: Bearer <access>`
4. **Access expires** → frontend hits `POST /auth/refresh` with cookie → new pair
5. **Refresh token reuse** → all sessions revoked
6. **Logout** → revoke current refresh token

## Roles

- `customer`
- `partner`
- `admin`
- `super_admin`

Endpoints declare role via `require_role(...)` dependency.

## Object-level checks

In addition to role, services verify the actor can access the object:

- Customer ↔ own orders / addresses / reviews
- Partner ↔ own laundry's orders / pricing
- Admin ↔ all (with audit)

## OTP (optional)

- 6 digit, 5 min TTL, max 5 attempts
- Rate-limited (5 per hour per identifier)
- Used for: phone verification, password reset, sensitive admin actions

## MFA (future)

- TOTP-based MFA for admin accounts
- Recovery codes
- Mandatory for `super_admin`

## Cookies

- Refresh cookie: `HttpOnly; Secure; SameSite=Lax; Path=/api/v1/auth`
- No long-lived auth cookies for customer/partner outside refresh

## Brute force / abuse

- Login: 10 attempts / 15 min per IP
- OTP request: 5 / hour per identifier
- Soft lock with CAPTCHA (future)

## Audit

- Login success / failure
- Logout
- Password reset
- Role changes
- MFA enrollment / removal
- Token reuse events

See `.cursor/rules/09-security.md`.
