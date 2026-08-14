#!/usr/bin/env python3
"""Post-deploy smoke for interim production API (Render).

401 on protected partner routes means the route is registered (good).
404 means the backend image is stale — redeploy from main.

Usage:
  python scripts/smoke_production_api.py
  python scripts/smoke_production_api.py --base https://washhouse.onrender.com/api/v1
"""

from __future__ import annotations

import argparse
import sys
import urllib.error
import urllib.request


def probe(url: str) -> int | str:
    try:
        with urllib.request.urlopen(url, timeout=30) as resp:
            return resp.status
    except urllib.error.HTTPError as exc:
        return exc.code
    except Exception as exc:  # noqa: BLE001 — CLI script
        return type(exc).__name__


def main() -> int:
    parser = argparse.ArgumentParser(description="Smoke-test production API routes.")
    parser.add_argument(
        "--base",
        default="https://washhouse.onrender.com/api/v1",
        help="API base URL including /api/v1",
    )
    args = parser.parse_args()
    base = args.base.rstrip("/")

    checks: list[tuple[str, int]] = [
        (f"{base}/health", 200),
        (f"{base}/partner/analytics/dashboard", 401),
        (f"{base}/partner/garment-catalog", 401),
        (f"{base}/partner/garment-catalog/import/preview", 401),
    ]

    failed = False
    for url, expected in checks:
        status = probe(url)
        ok = status == expected
        mark = "OK" if ok else "FAIL"
        print(f"[{mark}] {url} -> {status} (expected {expected})")
        if not ok:
            failed = True

    if failed:
        print(
            "\nPartner routes returning 404 usually mean Render is running an old build. "
            "Redeploy dlm-backend on Render from main, or set RENDER_DEPLOY_HOOK_URL in GitHub.",
            file=sys.stderr,
        )
        return 1
    print("\nAll checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
