"""Seed The WashHouse suggested catalog into platform_catalog_items.

Usage (from backend/ with venv active):
    python scripts/seed_washhouse_catalog.py

Idempotent by slug. Does NOT create laundry_item_prices rows.
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

import structlog
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import settings
from app.db.seed_washhouse_catalog import ensure_washhouse_catalog

log = structlog.get_logger(__name__)


async def main() -> None:
    log.info("seed_washhouse_catalog.start")
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    factory = async_sessionmaker(bind=engine, expire_on_commit=False)

    async with factory() as session:
        result = await ensure_washhouse_catalog(session)
        await session.commit()
        log.info("seed_washhouse_catalog.ok", **result)

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
