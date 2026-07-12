# Apply Alembic migrations (Windows).
# Usage:
#   .\scripts\migrate.ps1
#   .\scripts\migrate.ps1 upgrade head
#   .\scripts\migrate.ps1 revision --autogenerate -m "add orders"

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location (Join-Path $root "backend")

if (Test-Path "DLM_env/Scripts/Activate.ps1") { & "DLM_env/Scripts/Activate.ps1" }

if ($args.Count -eq 0) {
    alembic upgrade head
} else {
    alembic @args
}
