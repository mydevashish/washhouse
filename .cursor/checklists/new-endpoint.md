# New API Endpoint Checklist

## Design

- [ ] Resource-oriented path (`/api/v1/<resource_plural>`)
- [ ] Correct HTTP method
- [ ] Auth + role requirements decided
- [ ] Pagination params (if list)
- [ ] Idempotency considered (if state-changing POST)

## Code

- [ ] Pydantic schemas (inbound `extra="forbid"`)
- [ ] Service method with business logic
- [ ] Repository method (if new DB access)
- [ ] Endpoint thin wrapper
- [ ] `Depends(get_current_user)` (or `require_role(...)`)
- [ ] Object-level authz check in service
- [ ] Domain errors raised, not HTTPException

## OpenAPI

- [ ] `summary`
- [ ] `description`
- [ ] `response_model`
- [ ] `responses={...}` for non-200
- [ ] `tags=[...]`

## Tests

- [ ] 401 without token
- [ ] 403 wrong role
- [ ] 404 IDOR / not-found
- [ ] 422 validation
- [ ] 409 domain conflicts
- [ ] Happy path 200/201
- [ ] Pagination boundaries
- [ ] Rate limit (if sensitive)

## Side effects

- [ ] Celery tasks queued only after DB commit
- [ ] Cache invalidations explicit
- [ ] Audit log entry (admin / money)
- [ ] Logs at start / ok / fail

## Docs

- [ ] `docs/api/endpoints/<resource>.md` updated
- [ ] OpenAPI renders cleanly at `/api/v1/docs`
