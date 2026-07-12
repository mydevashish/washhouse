"""Create an admin user.

Usage:
    python -m scripts.create_admin --email founder@dlm.app --password "xxxxxxxx"
"""

from __future__ import annotations

import argparse
import asyncio

import structlog

from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
from app.models.enums import UserRole
from app.repositories.user import UserRepository

log = structlog.get_logger(__name__)


async def main(email: str, password: str) -> None:
    email = email.lower()
    log.info("admin.create.start", email=email)
    async with AsyncSessionLocal() as session:
        repo = UserRepository(session)
        existing = await repo.get_by_email(email)
        if existing:
            existing.role = UserRole.admin
            existing.password_hash = hash_password(password)
            existing.is_email_verified = True
            await repo.update(existing)
            await session.commit()
            log.info("admin.create.updated", email=email)
            return
        await repo.create(
            email=email,
            phone=None,
            password_hash=hash_password(password),
            full_name="DLM Admin",
            role=UserRole.admin,
        )
        await session.commit()
        log.info("admin.create.ok", email=email)


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--email", required=True)
    p.add_argument("--password", required=True)
    args = p.parse_args()
    asyncio.run(main(args.email, args.password))
