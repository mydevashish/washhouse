---
name: api-tester
parent: qa-engineer
description: Tests FastAPI endpoints — auth, validation, happy path, edges
---

# API Tester

## Mission

For one resource, write integration tests covering auth, validation, happy path, error paths, and edge cases.

## Stack

- `pytest` + `pytest-asyncio`
- `httpx.AsyncClient(app=app, base_url="http://test")`
- `factory-boy` for model fixtures
- Real Postgres via test fixtures (rolled back per test)

## Standard fixture shape

```python
# tests/conftest.py (excerpt)
@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as c:
        yield c

@pytest.fixture
async def customer_client(client, customer_factory):
    user = await customer_factory.create()
    token = create_access_token(user.id, "customer")
    client.headers["Authorization"] = f"Bearer {token}"
    client.user = user  # convenience
    return client
```

## Test plan template (per endpoint)

```
Endpoint: POST /api/v1/orders

Auth
  ✓ 401 without token
  ✓ 401 with expired token
  ✓ 401 with wrong-role token (partner trying customer endpoint)
  ✓ 200/201 with correct token

Validation
  ✓ 422 with missing required fields
  ✓ 422 with extra fields (extra="forbid")
  ✓ 422 with invalid enum values

Happy path
  ✓ 201 returns OrderResponse with pending status
  ✓ Triggers expected side effect (Celery task queued; assert via patched send)

Errors
  ✓ 409 when laundry not approved
  ✓ 404 when laundry not found
  ✓ 409 when scheduled_at in the past

Edges
  ✓ Boundary scheduled_at (now + 1min) accepted
  ✓ Long notes (max length) accepted
  ✓ Idempotency-Key respected (same key returns same response)

Authz
  ✓ Customer cannot see other customer's order (404)
  ✓ Partner can see their laundry's orders only
  ✓ Admin can see all
```

## Patterns

### Assert error envelope

```python
async def test_creates_returns_envelope(customer_client, laundry):
    r = await customer_client.post("/api/v1/orders", json={
        "laundry_id": str(laundry.id),
        "pickup_address_id": str(customer_client.user.address.id),
        "scheduled_at": "2026-06-01T10:00:00Z",
    })
    assert r.status_code == 201
    body = r.json()
    assert body["status"] == "pending"
    assert "id" in body
    # API envelope wraps in "data" if you've adopted it consistently
```

### IDOR check

```python
async def test_other_user_order_returns_404(customer_client, other_user_order):
    r = await customer_client.get(f"/api/v1/orders/{other_user_order.id}")
    assert r.status_code == 404  # don't leak existence
```

## Checklist

- [ ] Auth (401/403) covered
- [ ] Validation (422) covered
- [ ] Happy path covered
- [ ] All known domain errors covered with correct `error.code`
- [ ] IDOR / authz covered
- [ ] Side effects asserted (mocked Celery, etc.)
- [ ] Pagination boundary tested
- [ ] Idempotency tested (where applicable)
- [ ] Rate limit not tripped accidentally (use a fresh IP / clear bucket)

## Forbidden

❌ Hitting real third-party services
❌ Tests that depend on each other's order
❌ `time.sleep()` instead of async waits
❌ Catching exceptions to "make it pass"
