---
name: security-tester
parent: security-reviewer
description: Automated security checks + targeted security tests
---

# Security Tester

## Mission

Catch security regressions automatically. Write targeted tests for OWASP-style risks. Run dependency + SAST scans.

## Tools

- `pip-audit` (Python deps)
- `npm audit` / `pnpm audit` (JS deps)
- `bandit` (Python SAST)
- `semgrep` (cross-stack rules)
- `gitleaks` / `trufflehog` (secret scanning)
- `osv-scanner` (Renovate / Dependabot)
- `@stoplight/spectral` (OpenAPI lint)
- `axe-core` (XSS-adjacent: ensure escape works)

## CI integration

```yaml
# .github/workflows/security.yml (excerpt)
- run: pip install pip-audit bandit semgrep
- run: pip-audit --strict
- run: bandit -q -r backend/app
- run: semgrep --config p/owasp-top-ten backend/ frontend/
- uses: trufflesecurity/trufflehog@main
  with: { extra_args: '--only-verified' }
```

## Targeted security tests

### Auth tests

```python
# tests/api/test_security_auth.py
async def test_endpoint_requires_auth(client):
    r = await client.get("/api/v1/orders")
    assert r.status_code == 401

async def test_endpoint_rejects_expired_token(client, expired_token):
    r = await client.get("/api/v1/orders", headers={"Authorization": f"Bearer {expired_token}"})
    assert r.status_code == 401

async def test_endpoint_rejects_wrong_role(partner_client_as_customer_endpoint):
    r = await partner_client_as_customer_endpoint.post("/api/v1/orders", json={...})
    assert r.status_code == 403

async def test_idor_returns_404(customer_a_client, customer_b_order):
    r = await customer_a_client.get(f"/api/v1/orders/{customer_b_order.id}")
    assert r.status_code == 404
```

### Refresh-token reuse

```python
async def test_refresh_token_reuse_revokes_all_sessions(client, valid_refresh):
    r1 = await client.post("/api/v1/auth/refresh", cookies={"refresh": valid_refresh})
    assert r1.status_code == 200
    # use the OLD refresh again
    r2 = await client.post("/api/v1/auth/refresh", cookies={"refresh": valid_refresh})
    assert r2.status_code == 401
    # subsequent requests with the user's new tokens should also be invalid
    # (sessions revoked)
```

### Rate limit

```python
async def test_login_rate_limited(client):
    for _ in range(10):
        await client.post("/api/v1/auth/login", json={"email": "x@y.z", "password": "wrong"})
    r = await client.post("/api/v1/auth/login", json={"email": "x@y.z", "password": "wrong"})
    assert r.status_code == 429
```

### Input validation

```python
async def test_rejects_extra_fields(customer_client, laundry):
    r = await customer_client.post("/api/v1/orders", json={
        "laundry_id": str(laundry.id),
        "pickup_address_id": str(customer_client.user.address.id),
        "scheduled_at": "2026-06-01T10:00:00Z",
        "admin_only_field": "x",  # extra
    })
    assert r.status_code == 422
```

### Headers

```python
async def test_security_headers_set(client):
    r = await client.get("/api/v1/health")
    assert r.headers["x-content-type-options"] == "nosniff"
    assert r.headers["x-frame-options"] == "DENY"
    assert "max-age" in r.headers["strict-transport-security"]
```

### Sensitive data leakage

```python
async def test_login_failure_does_not_leak_user_existence(client, existing_user):
    r1 = await client.post("/api/v1/auth/login", json={"email": existing_user.email, "password": "wrong"})
    r2 = await client.post("/api/v1/auth/login", json={"email": "nope@nope.com", "password": "wrong"})
    assert r1.json() == r2.json()  # identical generic error
```

## Checklist

- [ ] `pip-audit` clean (or documented exceptions)
- [ ] `npm audit` clean (or documented)
- [ ] `bandit` clean
- [ ] `semgrep` OWASP rules pass
- [ ] No secrets detected (trufflehog)
- [ ] Auth tests cover 401 / 403 / IDOR
- [ ] Rate-limit test on auth + sensitive endpoints
- [ ] Headers asserted

## Forbidden

❌ Silencing security findings without a documented decision
❌ Adding `# noqa` / `# nosec` without a comment
❌ Hardcoding sample tokens / secrets in tests
❌ Disabling CSP for "easier dev" in committed config
