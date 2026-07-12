#!/usr/bin/env bash
# One-shot dev setup for Doorstep Laundry Marketplace.
# Idempotent — safe to re-run.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

say() { printf "\033[1;36m▶ %s\033[0m\n" "$*"; }
ok()  { printf "\033[1;32m✓ %s\033[0m\n" "$*"; }
warn(){ printf "\033[1;33m! %s\033[0m\n" "$*"; }

# --- env files ---
say "Ensuring .env files"
[ -f backend/.env ]  || { cp backend/.env.example backend/.env;  warn "Created backend/.env (fill values)";  }
[ -f frontend/.env.local ] || { cp frontend/.env.example frontend/.env.local; warn "Created frontend/.env.local"; }

# --- backend (DLM_env) ---
say "Backend: Python venv (DLM_env) + deps"
if [ ! -d "backend/DLM_env" ]; then
  python -m venv backend/DLM_env
fi
# shellcheck disable=SC1091
source backend/DLM_env/bin/activate
pip install --upgrade pip
pip install -r backend/requirements/dev.txt
deactivate

# --- frontend ---
say "Frontend: pnpm install"
if ! command -v pnpm >/dev/null 2>&1; then
  warn "pnpm not found; installing via corepack"
  corepack enable
  corepack prepare pnpm@9 --activate
fi
(cd frontend && pnpm install --frozen-lockfile || pnpm install)

# --- git hooks ---
say "Git hooks (pre-commit)"
if [ -d .git ] && command -v pre-commit >/dev/null 2>&1; then
  pre-commit install || true
else
  warn "pre-commit not installed (optional)"
fi

ok "Setup complete. Next: 'scripts/dev.sh' to start the stack."
