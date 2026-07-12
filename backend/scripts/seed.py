"""Idempotent dev seeder.

Usage (from backend/ with venv active):
    python scripts/seed.py
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

import structlog

# Allow `python scripts/seed.py` from backend/
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.security import hash_password
from app.db.seed_demo import ensure_demo_data
from app.models.enums import UserRole
from app.models.user import User

log = structlog.get_logger(__name__)


async def main() -> None:
    log.info("seed.start")
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    factory = async_sessionmaker(bind=engine, expire_on_commit=False)

    async with factory() as session:
        await _seed_admin(session)
        await session.commit()

    await engine.dispose()

    await ensure_demo_data()
    log.info("seed.ok")


async def _seed_admin(session: AsyncSession) -> None:
    email = settings.SEED_ADMIN_EMAIL.lower()
    result = await session.execute(select(User).where(User.email == email))
    if result.scalar_one_or_none():
        log.info("seed.admin_exists", email=email)
        return

    session.add(
        User(
            email=email,
            full_name=settings.SEED_ADMIN_FULL_NAME,
            password_hash=hash_password(settings.SEED_ADMIN_PASSWORD),
            role=UserRole.admin,
            is_email_verified=True,
        ),
    )
    await session.flush()
    log.info("seed.admin_created", email=email)


if __name__ == "__main__":
    asyncio.run(main())
