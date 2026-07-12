# Prompt: Refactor

Act as **<frontend-architect | backend-architect>** then **code-reviewer**.

Target: **<area>** (e.g., `services/order_service.py`, `features/orders/`)
Goal: **<measurable goal>** (e.g., "extract base repository", "reduce duplication", "decouple X from Y")
Constraints: **no behavior change**

## Steps

1. Read `.cursor/rules/01-architecture.md`, `.cursor/rules/02-code-quality.md`.
2. List the smells you'll address (DRY, SRP, hidden coupling, etc.).
3. Establish a safety net: confirm tests cover the area; add tests if not.
4. Refactor in **small steps**; run tests between each.
5. Keep public APIs stable unless the goal is to change them.
6. No new features in this PR.
7. Update `logs/refactor-log.md`:
   ```
   ## YYYY-MM-DD — <Title>
   - Smell: ...
   - Approach: ...
   - Before: complexity / size / coupling
   - After:  complexity / size / coupling
   - Tests:  added / unchanged
   ```
8. Run `.cursor/checklists/post-flight.md`.

If the change touches public APIs, **stop and propose an ADR first**.
