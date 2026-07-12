#!/usr/bin/env python3
"""Seed approved laundry + services for local dev. Run from repo root with backend venv active."""

from __future__ import annotations

import asyncio
import os
import sys
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models.enums import LaundryStatus, UserRole
from app.models.laundry import Laundry, LaundryService
from app.models.subscription import SubscriptionPlan
from app.models.user import User
from app.core.security import hash_password


async def main() -> None:
    async with AsyncSessionLocal() as session:
        from app.core.config import settings as app_settings

        email = os.environ.get("SEED_ADMIN_EMAIL", app_settings.SEED_ADMIN_EMAIL).lower()
        result = await session.execute(select(User).where(User.email == email))
        admin = result.scalar_one_or_none()
        if not admin:
            password = os.environ.get("SEED_ADMIN_PASSWORD", app_settings.SEED_ADMIN_PASSWORD)
            admin = User(
                email=email,
                phone=None,
                password_hash=hash_password(password),
                full_name=app_settings.SEED_ADMIN_FULL_NAME,
                role=UserRole.admin,
                is_email_verified=True,
            )
            session.add(admin)
            await session.flush()

        result = await session.execute(select(Laundry).where(Laundry.slug == "sparkle-clean-demo"))
        laundry = result.scalar_one_or_none()
        if not laundry:
            laundry = Laundry(
                owner_user_id=admin.id,
                name="Sparkle Clean Demo",
                slug="sparkle-clean-demo",
                city="Bengaluru",
                address_line="Indiranagar, Bengaluru",
                status=LaundryStatus.approved,
                is_verified=True,
                avg_rating=Decimal("4.5"),
                review_count=12,
            )
            session.add(laundry)
            await session.flush()
            for name, cat, price in [
                ("Wash & Fold", "wash", Decimal("80")),
                ("Steam Iron", "iron", Decimal("40")),
                ("Dry Cleaning", "dry_clean", Decimal("150")),
            ]:
                session.add(
                    LaundryService(
                        laundry_id=laundry.id,
                        name=name,
                        category=cat,
                        price_inr=price,
                    ),
                )

        plans = [
            ("student", "Student Plan", Decimal("499"), Decimal("5")),
            ("bachelor", "Bachelor Plan", Decimal("799"), Decimal("10")),
            ("family", "Family Plan", Decimal("1299"), Decimal("15")),
        ]
        for slug, name, price, disc in plans:
            exists = await session.execute(
                select(SubscriptionPlan).where(SubscriptionPlan.slug == slug),
            )
            if not exists.scalar_one_or_none():
                session.add(
                    SubscriptionPlan(
                        slug=slug,
                        name=name,
                        price_inr=price,
                        discount_percent=disc,
                    ),
                )

        await session.commit()
        print("Seed complete.")


if __name__ == "__main__":
    asyncio.run(main())
