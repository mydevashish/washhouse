# Seed local DB with realistic dev fixtures (Windows).

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location (Join-Path $root "backend")

if (Test-Path "DLM_env/Scripts/Activate.ps1") { & "DLM_env/Scripts/Activate.ps1" }

python scripts/seed.py @args
