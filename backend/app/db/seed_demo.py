"""Idempotent demo laundries, partners, and sample customer for local dev."""

from __future__ import annotations

from decimal import Decimal

import structlog
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
from app.models.enums import LaundryStatus, UserRole
from app.models.laundry import Laundry, LaundryService
from app.models.user import User
from app.models.user_address import UserAddress

log = structlog.get_logger(__name__)

DEMO_PARTNER_PASSWORD = "Partner@1234"

DEMO_PARTNER_PHONES: dict[str, str] = {
    "partner.koramangala@demo.dlm": "+91 98765 43210",
    "partner.indiranagar@demo.dlm": "+91 98765 43211",
    "partner.hsr@demo.dlm": "+91 98765 43212",
}

DEMO_LAUNDRIES: list[dict] = [
    {
        "slug": "demo-quick-wash-koramangala",
        "owner_email": "partner.koramangala@demo.dlm",
        "owner_name": "Rajesh Kumar",
        "name": "Quick Wash Koramangala",
        "city": "Bengaluru",
        "address_line": "12 80 Feet Road, Koramangala 4th Block, 560034",
        "description": "Same-day wash & fold with doorstep pickup. Eco-friendly detergents.",
        "tags": ["wash", "fold", "koramangala", "same-day", "eco-friendly"],
        "avg_rating": Decimal("4.60"),
        "review_count": 128,
        # Client Near me (haversine) — Koramangala 4th Block
        "latitude": Decimal("12.9352000"),
        "longitude": Decimal("77.6245000"),
        "services": [
            ("Wash & Fold", "wash", "kg", Decimal("79")),
            ("Dry Clean", "dry_clean", "piece", Decimal("149")),
            ("Iron Only", "iron", "piece", Decimal("39")),
        ],
    },
    {
        "slug": "demo-sparkle-indiranagar",
        "owner_email": "partner.indiranagar@demo.dlm",
        "owner_name": "Priya Sharma",
        "name": "Sparkle Clean Indiranagar",
        "city": "Bengaluru",
        "address_line": "100 Feet Road, HAL 2nd Stage, Indiranagar, 560038",
        "description": "Premium care for formals and delicate fabrics. Free pickup over ₹500.",
        "tags": ["premium", "dry-clean", "indiranagar", "formals"],
        "avg_rating": Decimal("4.80"),
        "review_count": 256,
        "latitude": Decimal("12.9784000"),
        "longitude": Decimal("77.6408000"),
        "services": [
            ("Wash & Fold", "wash", "kg", Decimal("89")),
            ("Premium Dry Clean", "dry_clean", "piece", Decimal("199")),
            ("Steam Press", "iron", "piece", Decimal("59")),
        ],
    },
    {
        "slug": "demo-freshfold-hsr",
        "owner_email": "partner.hsr@demo.dlm",
        "owner_name": "Amit Verma",
        "name": "FreshFold HSR Layout",
        "city": "Bengaluru",
        "address_line": "27th Main Road, Sector 1, HSR Layout, 560102",
        "description": "Budget-friendly laundry for students and families. Open 7 days.",
        "tags": ["budget", "hsr", "students", "family"],
        "avg_rating": Decimal("4.40"),
        "review_count": 89,
        "latitude": Decimal("12.9116000"),
        "longitude": Decimal("77.6389000"),
        "services": [
            ("Wash & Fold", "wash", "kg", Decimal("69")),
            ("Blanket / Quilt", "wash", "piece", Decimal("249")),
            ("Shoe Clean", "special", "pair", Decimal("199")),
        ],
    },
]

DEMO_CUSTOMER = {
    "email": "customer@demo.dlm",
    "password": "Customer@1234",
    "full_name": "Demo Customer",
    "address": {
        "label": "Home",
        "line1": "42 Demo Street, Koramangala",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pincode": "560034",
        "is_default": True,
    },
}


async def ensure_demo_data() -> None:
    async with AsyncSessionLocal() as session:
        created = 0
        repaired = 0
        for spec in DEMO_LAUNDRIES:
            existing = await session.execute(
                select(Laundry)
                .where(Laundry.slug == spec["slug"])
                .options(selectinload(Laundry.services)),
            )
            laundry_row = existing.scalar_one_or_none()
            if laundry_row:
                # Public list_public only returns approved rows — keep demo shops discoverable.
                changed = False
                if laundry_row.status != LaundryStatus.approved:
                    laundry_row.status = LaundryStatus.approved
                    changed = True
                if not laundry_row.is_verified:
                    laundry_row.is_verified = True
                    changed = True
                if laundry_row.deleted_at is not None:
                    laundry_row.deleted_at = None
                    changed = True
                # Backfill coords for client Near me when missing on existing demo rows.
                if laundry_row.latitude is None and spec.get("latitude") is not None:
                    laundry_row.latitude = spec["latitude"]
                    changed = True
                if laundry_row.longitude is None and spec.get("longitude") is not None:
                    laundry_row.longitude = spec["longitude"]
                    changed = True
                if changed:
                    repaired += 1
                    log.info(
                        "db.seed.laundry_repaired",
                        slug=spec["slug"],
                        status=laundry_row.status.value,
                    )
                continue

            owner_result = await session.execute(
                select(User).where(User.email == spec["owner_email"].lower()),
            )
            owner = owner_result.scalar_one_or_none()
            partner_phone = DEMO_PARTNER_PHONES.get(spec["owner_email"].lower())
            if not owner:
                owner = User(
                    email=spec["owner_email"].lower(),
                    phone=partner_phone,
                    password_hash=hash_password(DEMO_PARTNER_PASSWORD),
                    full_name=spec["owner_name"],
                    role=UserRole.partner,
                    is_email_verified=True,
                )
                session.add(owner)
                await session.flush()
            elif partner_phone and not (owner.phone or "").strip():
                owner.phone = partner_phone

            laundry = Laundry(
                owner_user_id=owner.id,
                name=spec["name"],
                slug=spec["slug"],
                city=spec["city"],
                address_line=spec["address_line"],
                description=spec["description"],
                tags=spec.get("tags", []),
                status=LaundryStatus.approved,
                is_verified=True,
                avg_rating=spec["avg_rating"],
                review_count=spec["review_count"],
                latitude=spec.get("latitude"),
                longitude=spec.get("longitude"),
            )
            session.add(laundry)
            await session.flush()

            for svc_name, category, unit, price in spec["services"]:
                session.add(
                    LaundryService(
                        laundry_id=laundry.id,
                        name=svc_name,
                        category=category,
                        unit=unit,
                        price_inr=price,
                        is_active=True,
                    ),
                )
            created += 1
            log.info("db.seed.laundry_created", slug=spec["slug"], name=spec["name"])

        customer_created = await _seed_demo_customer(session)
        await session.commit()

        if created or repaired:
            from app.services.laundry_service import invalidate_laundry_discovery_cache

            await invalidate_laundry_discovery_cache()
            log.info(
                "db.seed.demo_laundries",
                created=created,
                repaired=repaired,
            )
        else:
            log.info("db.seed.demo_laundries_exists")
        if customer_created:
            log.info("db.seed.demo_customer_created", email=DEMO_CUSTOMER["email"])


async def _seed_demo_customer(session) -> bool:
    email = DEMO_CUSTOMER["email"].lower()
    result = await session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        user = User(
            email=email,
            password_hash=hash_password(DEMO_CUSTOMER["password"]),
            full_name=DEMO_CUSTOMER["full_name"],
            role=UserRole.customer,
            is_email_verified=True,
        )
        session.add(user)
        await session.flush()

    addr_result = await session.execute(
        select(UserAddress).where(UserAddress.user_id == user.id).limit(1),
    )
    if addr_result.scalar_one_or_none():
        return False

    a = DEMO_CUSTOMER["address"]
    session.add(
        UserAddress(
            user_id=user.id,
            label=a["label"],
            line1=a["line1"],
            city=a["city"],
            state=a["state"],
            pincode=a["pincode"],
            is_default=a["is_default"],
        ),
    )
    return True
