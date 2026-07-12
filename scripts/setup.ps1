# One-shot dev setup for Windows (PowerShell).
# Idempotent — safe to re-run.

$ErrorActionPreference = "Stop"

function Say($msg)  { Write-Host "▶ $msg" -ForegroundColor Cyan }
function Ok($msg)   { Write-Host "✓ $msg" -ForegroundColor Green }
function Warn($msg) { Write-Host "! $msg" -ForegroundColor Yellow }

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $root

# --- env files ---
Say "Ensuring .env files"
if (-not (Test-Path "backend/.env"))          { Copy-Item backend/.env.example backend/.env; Warn "Created backend/.env (fill values)" }
if (-not (Test-Path "frontend/.env.local"))   { Copy-Item frontend/.env.example frontend/.env.local; Warn "Created frontend/.env.local" }

# --- backend (DLM_env) ---
Say "Backend: Python venv (DLM_env) + deps"
if (-not (Test-Path "backend/DLM_env")) {
    python -m venv backend/DLM_env
}
& "backend/DLM_env/Scripts/python.exe" -m pip install --upgrade pip
& "backend/DLM_env/Scripts/pip.exe" install -r backend/requirements/dev.txt

# --- frontend ---
Say "Frontend: pnpm install"
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Warn "pnpm not found; enabling corepack"
    corepack enable
    corepack prepare pnpm@9 --activate
}
Push-Location frontend
try {
    pnpm install --frozen-lockfile
} catch {
    pnpm install
}
Pop-Location

Ok "Setup complete. Next: 'scripts/dev.ps1' to start the stack."
