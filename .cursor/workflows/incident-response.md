# Incident Response Workflow

When something is on fire.

## Severity

| SEV  | Definition                                            | Response time |
| ---- | ----------------------------------------------------- | ------------- |
| SEV1 | Customer-facing outage or data loss                   | Immediate     |
| SEV2 | Major flow broken; many customers affected            | < 30 min      |
| SEV3 | Degraded experience; subset of customers              | < 4 hours     |
| SEV4 | Cosmetic / non-urgent                                  | Next business day |

## Phases

```
Detect  →  Acknowledge  →  Triage  →  Mitigate  →  Resolve  →  Post-mortem
```

## 1. Detect

- Sentry alert, monitoring, customer report, manual
- Open an incident in #dlm-incidents

## 2. Acknowledge

- Take ownership (incident commander)
- Pin the channel thread
- Open status page (SEV1 + SEV2)

## 3. Triage

- Severity?
- Scope (which feature, which user segment, region)?
- Working theory of cause?
- Recent deploys (release tag + diff)?

## 4. Mitigate first

- **Rollback** the recent deploy if recent (≤ 1 h ago)
- **Feature flag** off if available
- Stop the bleeding before debugging

## 5. Resolve

- Bug-fix workflow (`.cursor/workflows/bug-fix.md`)
- Failing test → fix → verify → deploy
- Update status page when resolved

## 6. Post-mortem

- Within 5 business days (SEV1/SEV2 mandatory; SEV3 if pattern)
- File: `docs/decisions/INC-YYYY-MM-DD-<slug>.md`
- Blameless. Focus on systems + process.
- Sections:
  - Timeline
  - Root cause
  - Contributing factors
  - Customer impact
  - Detection
  - Mitigation steps
  - Resolution
  - Prevention (new tests / rules / monitors)
- Action items tracked as issues with owners + dates

## Communication

| SEV  | Internal             | External                    |
| ---- | -------------------- | --------------------------- |
| SEV1 | Channel + page on-call | Status page + email blast |
| SEV2 | Channel               | Status page                 |
| SEV3 | Channel               | Optional update             |
| SEV4 | Channel              | None                        |

## Tools

- Sentry — error tracking
- Vercel / Railway — recent deploys
- Neon — DB health
- Upstash — Redis health
- Status page — customer comms
