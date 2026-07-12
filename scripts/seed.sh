#!/usr/bin/env bash
# Seed local DB with realistic dev fixtures.
# Idempotent.

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/backend"

# shellcheck disable=SC1091
if [ -d DLM_env ]; then source DLM_env/bin/activate; fi

python scripts/seed.py "$@"
