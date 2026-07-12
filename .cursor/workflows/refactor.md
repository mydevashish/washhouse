# Refactor Workflow

Refactoring is a separate, no-feature-change activity. Treat it like a contract:

> "I will change how it's done. I won't change what it does."

## Steps

1. **Scope.** Define a tight area. Smaller wins faster.
2. **Safety net.** Confirm tests cover the area. Add characterization tests if not.
3. **Plan in small steps.** Each step compiles + tests pass.
4. **Refactor in slices.** Commit each slice with `refactor(scope): …`.
5. **No new features.** No new behavior. No new dependencies (without ADR).
6. **No new files in unrelated places.** Stay within the scoped folder.
7. **Update `logs/refactor-log.md`**:
   ```
   ## YYYY-MM-DD — <Title>
   - Smell: ...
   - Approach: ...
   - Before: <metrics — lines, complexity, coupling>
   - After:  <metrics>
   - Tests:  added / unchanged / improved
   ```
8. **Run all reviewers** as if it's a feature PR.

## Good targets

- 3rd-time-duplicate ➜ extract helper / base class
- Long function (> 60 lines) ➜ split by responsibility
- Misplaced logic (business logic in router) ➜ move to service
- Tight coupling across features ➜ introduce interface boundary
- Hot path with N+1 ➜ add eager loading + index (perf-driven refactor)

## Bad targets (skip)

- Cosmetic renames with no test coverage
- "Modernize" in lieu of a real goal
- Touching layers you don't have tests for
- Mixing refactor + feature (it isn't a refactor anymore)

## Stop conditions

- Coverage drops
- p95 worsens
- Cyclomatic complexity rises
- You can't explain what got better in 2 sentences
