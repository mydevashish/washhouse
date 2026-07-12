#!/usr/bin/env bash
# Start the full local dev stack via Docker Compose.

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

docker compose up --build "$@"
