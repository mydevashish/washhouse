# Prompt: Add an API endpoint

Act as **backend-architect** delegating to **api-engineer**.

Endpoint: **<METHOD> <path>**
Purpose: **<one line>**
Auth: **customer | partner | admin**

## Steps

1. Read `.cursor/rules/05-api-standards.md`, `.cursor/agents/backend-architect.md`, `.cursor/sub-agents/backend/api-engineer.md`.
2. Run `.cursor/checklists/pre-flight.md`.
3. Implement using `.cursor/templates/fastapi-endpoint.py` + `fastapi-service.py` + `fastapi-repository.py`.
4. Add Pydantic schemas (inbound `extra="forbid"`).
5. Add `Depends(get_current_user)` + role check.
6. Add object-level authz in the service.
7. Raise domain errors; never `HTTPException` with arbitrary messages.
8. Add `summary`, `description`, `response_model`, `responses`, `tags`.
9. Write tests (`.cursor/sub-agents/qa/api-tester.md`):
   - 401, 403, 404 (IDOR), 422, 409, happy path
   - Pagination boundary if list
10. Update `docs/api/endpoints/<resource>.md`.
11. Update `logs/implementation-log.md`.
12. Run `.cursor/checklists/post-flight.md`.

Confirm the auth role before starting. Then post a 3–5 step plan and proceed.
