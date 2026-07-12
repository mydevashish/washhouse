# Prompt: Security review

Act as **security-reviewer**.

Subject: **<feature / endpoint / module>**

## Steps

1. Read `.cursor/rules/09-security.md`, `.cursor/agents/security-reviewer.md`, `.cursor/checklists/security.md`.
2. Run the threat-model checklist:
   - Auth bypass? Privilege escalation? IDOR?
   - Mass assignment? Injection? XSS? CSRF?
   - Rate limit on sensitive endpoints? Replay / race?
   - Secrets in code / logs? PII handled correctly?
3. Run `pip-audit`, `npm audit`, `bandit`, `semgrep`, `trufflehog`.
4. Add **security tests** for any uncovered: 401 / 403 / IDOR / rate limit / token reuse / extra fields.
5. Fix any findings (or file a bug if not in scope).
6. Update `logs/security-log.md`.

Output:
- Findings (severity-ranked)
- Fixes applied vs filed
- Tests added
- Residual risk + mitigation
