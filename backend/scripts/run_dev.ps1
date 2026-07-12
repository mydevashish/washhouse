# Start API using PORT from backend/.env (keeps frontend NEXT_PUBLIC_API_URL in sync).
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root ".env"
$port = 8000

if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*PORT\s*=\s*(\d+)\s*$') {
            $port = $Matches[1]
        }
    }
}

Write-Host "Starting DLM API on port $port (from .env PORT=...)"
Set-Location $root
uvicorn app.main:app --reload --host 0.0.0.0 --port $port
