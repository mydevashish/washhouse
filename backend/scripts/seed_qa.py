"""Run comprehensive QA seed dataset.

Usage (from backend/):
    python scripts/seed_qa.py
    python scripts/seed_qa.py --force   # re-run counts only if already seeded
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

import structlog

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.seed_qa import ensure_qa_seed, QA_SEED_KEY
from app.db.session import AsyncSessionLocal
from sqlalchemy import select, delete
from app.models.platform import PlatformSetting

log = structlog.get_logger(__name__)


async def main() -> None:
    force = "--force" in sys.argv
    if force:
        async with AsyncSessionLocal() as session:
            await session.execute(delete(PlatformSetting).where(PlatformSetting.key == QA_SEED_KEY))
            await session.commit()
        log.warning("qa_seed.force_reset_marker")

    summary = await ensure_qa_seed()
    print("\n=== QA Seed Summary ===")
    for k, v in sorted(summary.items()):
        print(f"  {k}: {v}")
    print("\nSee DEMO_ACCOUNTS.md for login credentials.\n")


if __name__ == "__main__":
    asyncio.run(main())
