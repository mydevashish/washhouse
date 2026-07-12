"""
Validate required env vars are present in .env files.

Usage:
    python scripts/check-env.py
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

BACKEND_REQUIRED = [
    "APP_ENV",
    "DATABASE_URL",
    "DATABASE_URL_DIRECT",
    "REDIS_URL",
    "CELERY_BROKER_URL",
    "CELERY_RESULT_BACKEND",
    "JWT_PRIVATE_KEY",
    "JWT_PUBLIC_KEY",
    "JWT_ALG",
    "JWT_ISSUER",
    "CORS_ALLOW_ORIGINS",
]

FRONTEND_REQUIRED = [
    "NEXT_PUBLIC_API_BASE_URL",
    "NEXT_PUBLIC_APP_URL",
]


def parse_env(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}
    out: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        s = line.strip()
        if not s or s.startswith("#") or "=" not in s:
            continue
        k, _, v = s.partition("=")
        out[k.strip()] = v.strip()
    return out


def check(label: str, env: dict[str, str], required: list[str]) -> list[str]:
    missing = [k for k in required if not env.get(k)]
    if missing:
        print(f"✗ {label}: missing {missing}")
    else:
        print(f"✓ {label}: ok")
    return missing


def main() -> int:
    backend = parse_env(ROOT / "backend" / ".env")
    frontend = parse_env(ROOT / "frontend" / ".env.local")

    issues: list[str] = []
    issues += check("backend/.env", backend, BACKEND_REQUIRED)
    issues += check("frontend/.env.local", frontend, FRONTEND_REQUIRED)

    return 1 if issues else 0


if __name__ == "__main__":
    sys.exit(main())
