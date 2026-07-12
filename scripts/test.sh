#!/usr/bin/env bash
# Run backend + frontend tests.

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "▶ Backend tests"
(
  cd "$ROOT/backend"
  if [ -d DLM_env ]; then source DLM_env/bin/activate; fi
  pytest -q
)

echo "▶ Frontend tests"
(
  cd "$ROOT/frontend"
  pnpm test:ci
)
