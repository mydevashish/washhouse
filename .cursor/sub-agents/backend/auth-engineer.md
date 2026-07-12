---
name: auth-engineer
parent: backend-architect
description: JWT auth, OTP, refresh, roles, rate limits
---

# Auth Engineer

## Mission

Implement and maintain authentication / authorization plumbing.

## Stack

- `passlib[bcrypt]` for password hashing
- `python-jose` for JWT (RS256 prod, HS256 dev)
- httpOnly + Secure refresh cookies (or secure storage on mobile)
- Redis-backed token blacklist + rate limits
- OTP via SMS / email (Celery task)

## Token policy

| Token   | TTL     | Storage                                  |
| ------- | ------- | ---------------------------------------- |
| Access  | 15 min  | Memory (frontend) / Authorization header |
| Refresh | 30 days | httpOnly Secure cookie + DB row (jti)    |
| OTP     | 5 min   | Redis with attempt counter               |

## Endpoints

```
POST /api/v1/auth/register             # email + password (+ role hint?)
POST /api/v1/auth/login                # email + password → access + set refresh cookie
POST /api/v1/auth/refresh              # uses refresh cookie → new pair (rotation)
POST /api/v1/auth/logout                # invalidates current refresh
POST /api/v1/auth/request-otp          # email or phone
POST /api/v1/auth/verify-otp           # OTP + identifier
POST /api/v1/auth/request-password-reset
POST /api/v1/auth/reset-password
GET  /api/v1/auth/me                   # current user
```

## Role hierarchy

```
super_admin > admin > partner ≷ customer (peers)
```

- `require_role("admin")` accepts admin and super_admin.
- `require_role("partner")` accepts partner only (admins use partner endpoints via impersonation, future).
- `require_role("customer")` accepts customer only.

## Patterns

### Hashing

```python
# app/core/security.py
from passlib.context import CryptContext

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

def hash_password(p: str) -> str: return pwd_ctx.hash(p)
def verify_password(p: str, h: str) -> bool: return pwd_ctx.verify(p, h)
```

### JWT issue

```python
import jwt
from datetime import datetime, timezone, timedelta
from uuid import uuid4
from app.core.config import settings

def create_access_token(user_id: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "role": role,
        "iat": now,
        "exp": now + timedelta(minutes=settings.ACCESS_TOKEN_TTL_MIN),
        "jti": str(uuid4()),
        "typ": "access",
    }
    return jwt.encode(payload, settings.JWT_PRIVATE_KEY, algorithm=settings.JWT_ALG)
```

### Refresh rotation

```python
async def refresh_pair(self, refresh_token: str) -> TokenPair:
    payload = self._decode_refresh(refresh_token)
    used = await self.repo.is_refresh_used(jti=payload["jti"])
    if used:
        # Compromise — kill all sessions for this user
        await self.repo.revoke_all_sessions(user_id=payload["sub"])
        raise AuthenticationError("Refresh token reuse detected")
    await self.repo.mark_refresh_used(jti=payload["jti"])
    user = await self.repo.get_user(payload["sub"])
    return self._issue_pair(user)
```

### Rate limit (login)

- 10 attempts / 15 min per IP
- 5 failed attempts / 15 min per email triggers a soft lock (CAPTCHA) — future
- OTP: 5 / hour per identifier

## Tests

- 401 when no token
- 401 when expired token
- 401 when wrong signature
- 403 when role mismatch
- 401 when refresh reused (and all sessions revoked)
- 429 when rate-limited

## Checklist

- [ ] Passwords hashed with bcrypt
- [ ] Tokens RS256 in prod
- [ ] Refresh cookie httpOnly + Secure + SameSite=Lax
- [ ] Refresh rotation enforced
- [ ] Token blacklist on logout
- [ ] Rate limit on login + OTP endpoints
- [ ] Audit log on password reset, role changes
- [ ] All sensitive endpoints behind `Depends`

## Forbidden

❌ MD5 / SHA on passwords
❌ Storing tokens in localStorage
❌ Reusing refresh tokens
❌ Sharing JWT secrets across environments
❌ Returning stack traces on auth failures
