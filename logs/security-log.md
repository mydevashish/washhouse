# Security Log

> Findings, fixes, audits, and exceptions. Sensitive details go to the private security tracker; reference it here.

## Entry template

```
### YYYY-MM-DD — <title>
- **Source:** internal review / SAST / pen test / external report
- **Severity:** critical / high / medium / low / info
- **CWE / OWASP:** ...
- **Affected:** <module / endpoint / dependency>
- **Description:** ...
- **Fix:** <PR>
- **Mitigations:** ...
- **Verification:** <test / scan>
- **Disclosed:** internal / public
```

## History

### 2026-05-25 — Workspace security guardrails established
- **Source:** internal review
- **Severity:** info
- **Description:** Adopted RS256 JWTs, bcrypt for passwords, security headers middleware, rate limit defaults, CORS allow-list, and secrets via env only.
- **Refs:** `rules/09-security.md`, `docs/security/auth.md`, `docs/security/threat-model.md`, `docs/security/secrets.md`.
