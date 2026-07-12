# Start the full local dev stack via Docker Compose.

$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot ".."))

docker compose up --build @args
