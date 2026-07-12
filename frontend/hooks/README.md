# Hooks

Cross-feature reusable hooks.

Feature-specific hooks live in `features/<feature>/hooks/`.

## Conventions

- File name: `use-<name>.ts`
- Export: `export function useFoo(...) { ... }`
- Strict types in + out
- No side-effects outside the hook lifecycle
- Document with TSDoc
