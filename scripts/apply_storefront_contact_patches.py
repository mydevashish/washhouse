"""Apply storefront contact patches from scripts/patches to backend."""
from __future__ import annotations

import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATCH_ROOT = ROOT / "scripts" / "patches" / "backend"
TARGET_ROOT = ROOT / "backend"

FILES = [
    "app/models/storefront.py",
    "app/services/storefront_service.py",
    "app/services/customer_experience_service.py",
    "app/db/seed_storefront.py",
]


def main() -> None:
    for rel in FILES:
        src = PATCH_ROOT / rel
        dst = TARGET_ROOT / rel
        if not src.exists():
            raise SystemExit(f"missing patch: {src}")
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        print(f"applied {rel}")


if __name__ == "__main__":
    main()
