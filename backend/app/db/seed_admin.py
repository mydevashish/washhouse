"""Ensure default admin user exists (local dev)."""

from __future__ import annotations

import structlog
from sqlalchemy import select

from app.core.config import settings
from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
from app.models.enums import UserRole
from app.models.user import User

log = structlog.get_logger(__name__)


async def ensure_default_admin() -> None:
    email = settings.SEED_ADMIN_EMAIL.lower()
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).where(User.email == email, User.deleted_at.is_(None)),
        )
        if result.scalar_one_or_none():
            log.info("db.seed.admin_exists", email=email)
            return

        session.add(
            User(
                email=email,
                phone=None,
                password_hash=hash_password(settings.SEED_ADMIN_PASSWORD),
                full_name=settings.SEED_ADMIN_FULL_NAME,
                role=UserRole.admin,
                is_email_verified=True,
            ),
        )
        await session.commit()
        log.info("db.seed.admin_created", email=email)
