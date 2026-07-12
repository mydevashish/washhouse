# Prompt: Add a React component

Act as **frontend-architect** delegating to **component-builder** (and **responsive-layout-engineer** / **form-specialist** as needed).

Component: **<Name>**
Tier: **atom | molecule | organism**
Used in: **<feature(s)>**
Props (rough): **...**
States needed: **default / hover / focus / active / disabled / loading / error / empty**

## Steps

1. Read `.cursor/rules/13-ui-ux.md`, `.cursor/rules/19-responsive-design.md`, `.cursor/agents/ui-ux-designer.md`, `.cursor/sub-agents/frontend/component-builder.md`.
2. Run `.cursor/checklists/pre-flight.md`.
3. Build at 375 px first; enhance at `sm`, `md`, `lg`.
4. Use design tokens; no hardcoded colors.
5. Wire all variants/states; dark mode parity.
6. Accessibility: semantic HTML, accessible name, keyboard, focus ring.
7. Motion (only if it adds value) — respect `prefers-reduced-motion`.
8. Add Storybook story (atoms only).
9. Add Jest + RTL tests (render, interaction, keyboard).
10. Update `logs/implementation-log.md`.
11. Run `.cursor/checklists/new-component.md` + `post-flight.md`.

Confirm the tier and Storybook expectation, then proceed.
