# Prompt: Accessibility review

Act as **accessibility-reviewer**.

Subject: **<route(s) / component(s)>**

## Steps

1. Read `.cursor/rules/10-accessibility.md`, `.cursor/agents/accessibility-reviewer.md`, `.cursor/checklists/accessibility.md`.
2. Run automated checks:
   - ESLint a11y plugin
   - `@axe-core/playwright` scan
3. Manual passes:
   - **Keyboard only** — tab through; activate; escape
   - **Screen reader sweep** — VoiceOver / NVDA
   - **Reduced motion** — toggle and re-test
   - **Contrast** — sample any non-token surfaces
4. Fix every critical/serious finding; file warnings as issues.
5. Update `docs/ui-ux/accessibility.md` if a new pattern is introduced.
6. Output:

```
## YYYY-MM-DD — A11y audit: <subject>
- Routes / components: ...
- Critical/Serious found: ...
- Fixed: ...
- Filed: ... (#issues)
- Patterns documented: ...
```
