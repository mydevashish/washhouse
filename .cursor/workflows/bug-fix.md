# Bug-Fix Workflow

```
1. Triage  →  2. Reproduce  →  3. Failing test  →  4. Fix
                                                       ↓
8. Post-mortem  ←  7. Monitor  ←  6. Deploy  ←  5. Verify
```

## 1. Triage

- Severity: SEV1 / SEV2 / SEV3 / SEV4
- Reporter, affected users, frequency
- File / open entry in `logs/bug-tracker.md` (template: `.cursor/templates/bug-report.md`)
- Assign to relevant agent

## 2. Reproduce

- Locally first
- If unable, gather more data (logs, Sentry, request IDs)
- Identify the minimal repro

## 3. Failing test

- Write a test that **fails** on `main`
- Place at the right level (unit / integration / E2E)

## 4. Fix

- Smallest possible code change
- No piggybacking other improvements
- Update / add logs that would have helped detect this sooner

## 5. Verify

- Failing test now passes
- Full suite still green
- Lint + type-check
- For UI: manual repro confirms fix

## 6. Deploy

- Hotfix branch from `main` if SEV1/SEV2
- Otherwise normal flow (`develop` → `main`)
- Tag a patch release

## 7. Monitor

- Sentry: bug no longer occurring
- Watch for regressions for 24 h

## 8. Post-mortem (SEV1 / SEV2)

- Within 5 business days
- Saved as `docs/decisions/INC-YYYY-MM-DD-<slug>.md`
- Sections: timeline, root cause, contributing factors, fix, prevention
- Update `logs/security-log.md` if security-relevant

## Update logs

- `logs/bug-tracker.md` → status `resolved`
- `logs/implementation-log.md` → entry
- `logs/decisions-log.md` if a pattern emerges
