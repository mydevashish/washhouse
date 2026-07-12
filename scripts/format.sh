#!/usr/bin/env bash
# Run all linters + formatters in fix mode.

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Backend
(
  cd "$ROOT/backend"
  # shellcheck disable=SC1091
  if [ -d DLM_env ]; then source DLM_env/bin/activate; fi
  ruff check --fix .
  ruff format .
)

# Frontend
(
  cd "$ROOT/frontend"
  pnpm lint --fix || true
  pnpm format
)
