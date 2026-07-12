# Scripts

Developer + operator helpers. Cross-platform when possible.

| Script                | Purpose                                                  |
| --------------------- | -------------------------------------------------------- |
| `setup.sh` / `setup.ps1` | One-shot dev setup (deps, env files, hooks)          |
| `dev.sh` / `dev.ps1`     | Start full local stack via docker compose            |
| `seed.sh` / `seed.ps1`   | Seed dev DB with realistic fixtures                  |
| `migrate.sh` / `migrate.ps1` | Run Alembic migrations against a target env      |
| `format.sh` / `format.ps1` | Run all linters + formatters                       |
| `test.sh` / `test.ps1`   | Run backend + frontend tests                         |
| `release.sh` / `release.ps1` | Tag a release + update logs                      |
| `check-env.py`        | Validate required env vars are present in `.env`         |

## Conventions

- Shell scripts use `#!/usr/bin/env bash` + `set -euo pipefail`
- PowerShell mirrors them for Windows devs
- All scripts are idempotent
- All scripts print a one-line "done" summary
