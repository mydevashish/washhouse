# Run all linters + formatters in fix mode (Windows).

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")

# Backend
Push-Location (Join-Path $root "backend")
try {
    if (Test-Path "DLM_env/Scripts/Activate.ps1") { & "DLM_env/Scripts/Activate.ps1" }
    ruff check --fix .
    ruff format .
} finally { Pop-Location }

# Frontend
Push-Location (Join-Path $root "frontend")
try {
    pnpm lint --fix
    pnpm format
} finally { Pop-Location }
