#!/usr/bin/env bash
# Apply Alembic migrations.
# Usage:
#   scripts/migrate.sh                  # upgrade to head (local)
#   scripts/migrate.sh upgrade head
#   scripts/migrate.sh revision --autogenerate -m "add orders"

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/backend"

# shellcheck disable=SC1091
if [ -d DLM_env ]; then source DLM_env/bin/activate; fi

if [ "$#" -eq 0 ]; then
  alembic upgrade head
else
  alembic "$@"
fi
