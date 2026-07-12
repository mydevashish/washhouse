# Run backend + frontend tests (Windows).

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")

Write-Host "▶ Backend tests" -ForegroundColor Cyan
Push-Location (Join-Path $root "backend")
try {
    if (Test-Path "DLM_env/Scripts/Activate.ps1") { & "DLM_env/Scripts/Activate.ps1" }
    pytest -q
} finally { Pop-Location }

Write-Host "▶ Frontend tests" -ForegroundColor Cyan
Push-Location (Join-Path $root "frontend")
try {
    pnpm test:ci
} finally { Pop-Location }
