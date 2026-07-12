#!/usr/bin/env python3
"""Measure API latency (cold vs warm). Run with backend on :8000."""

from __future__ import annotations

import json
import statistics
import sys
import time
import urllib.error
import urllib.request

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000/api/v1"


def get(path: str) -> tuple[int, float]:
    url = f"{BASE}{path}"
    start = time.perf_counter()
    try:
        with urllib.request.urlopen(url, timeout=15) as resp:
            resp.read()
            ms = (time.perf_counter() - start) * 1000
            return resp.status, ms
    except urllib.error.HTTPError as exc:
        ms = (time.perf_counter() - start) * 1000
        return exc.code, ms
    except OSError as exc:
        print(json.dumps({"error": str(exc), "base": BASE}))
        sys.exit(1)


def bench(name: str, path: str, runs: int = 5) -> dict:
    samples: list[float] = []
    status = 0
    for _ in range(runs):
        status, ms = get(path)
        samples.append(ms)
    return {
        "name": name,
        "path": path,
        "status": status,
        "runs": runs,
        "ms_min": round(min(samples), 1),
        "ms_avg": round(statistics.mean(samples), 1),
        "ms_p95": round(sorted(samples)[max(0, int(len(samples) * 0.95) - 1)], 1),
    }


def main() -> None:
    results = [
        bench("laundries_cold", "/laundries"),
        bench("laundries_warm", "/laundries"),
        bench("search_koramangala", "/laundries/search?q=koramangala&limit=20"),
        bench("search_wash", "/laundries/search?q=wash&sort=relevance"),
        bench("search_warm", "/laundries/search?q=wash&sort=relevance"),
        bench("health", "/health"),
    ]
    print(json.dumps({"base": BASE, "results": results}, indent=2))


if __name__ == "__main__":
    main()
