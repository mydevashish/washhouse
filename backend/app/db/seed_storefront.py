"""Rich demo storefront profiles for seeded laundries."""

from __future__ import annotations

from decimal import Decimal
from uuid import uuid4

import structlog
from sqlalchemy import or_, select

from app.db.session import AsyncSessionLocal
from app.models.laundry import Laundry
from app.models.storefront import LaundryStorefront
from app.models.user import User
from app.repositories.storefront import StorefrontRepository
from app.services.storefront_service import compute_completeness

log = structlog.get_logger(__name__)

DEMO_STOREFRONTS: dict[str, dict] = {
    "demo-quick-wash-koramangala": {
        "template_id": "express",
        "owner_name": "Rajesh Kumar",
        "years_in_business": 12,
        "contact_phone": "+91 98765 43210",
        "whatsapp_number": "+91 98765 43210",
        "show_call": True,
        "show_whatsapp": True,
        "approval_status": "approved",
        "tagline": "Same-day wash & fold with doorstep pickup",
        "brand_primary": "#dc2626",
        "brand_secondary": "#1d4ed8",
        "cover_url": "https://images.unsplash.com/photo-1582735680409-38e523e2aabf?auto=format&fit=crop&w=1200&q=80",
        "facilities": [
            "Same Day Delivery",
            "Express Service",
            "Eco Friendly Cleaning",
            "Industrial Machines",
            "Premium Packaging",
        ],
        "highlights": [
            {"title": "12 Years in Koramangala", "description": "Trusted neighbourhood laundry since 2014."},
            {"title": "10,000+ Orders Completed", "description": "Proven track record with local families."},
            {"title": "Free Pickup & Delivery", "description": "Doorstep service across 5 km radius."},
        ],
        "machines": [
            {
                "id": str(uuid4()),
                "name": "LG Industrial Washer",
                "brand": "LG",
                "description": "50 kg capacity commercial washer for bulk loads.",
                "image_url": "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=600&q=80",
            },
        ],
        "team": [
            {
                "id": str(uuid4()),
                "name": "Rajesh Kumar",
                "role": "Owner & Manager",
                "description": "15+ years in garment care.",
                "photo_url": "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80",
            },
        ],
        "certifications": [
            {
                "id": str(uuid4()),
                "title": "GST Registration",
                "issuer": "Government of India",
                "image_url": None,
            },
        ],
    },
    "demo-sparkle-indiranagar": {
        "template_id": "premium",
        "owner_name": "Priya Sharma",
        "years_in_business": 8,
        "contact_phone": "+91 98765 43211",
        "whatsapp_number": "+91 98765 43211",
        "show_call": True,
        "show_whatsapp": True,
        "approval_status": "approved",
        "tagline": "Premium care for formals and delicate fabrics",
        "brand_primary": "#1e3a5f",
        "brand_secondary": "#c9a227",
        "cover_url": "https://images.unsplash.com/photo-1582735680409-38e523e2aabf?auto=format&fit=crop&w=1200&q=80",
        "facilities": ["Premium Care", "Dry Cleaning", "Steam Iron", "Stain Removal Specialists"],
        "highlights": [
            {"title": "Designer Garment Care", "description": "Specialists in silk, wool, and delicate fabrics."},
            {"title": "Free Pickup Over ₹500", "description": "Doorstep collection for larger orders."},
            {"title": "Trusted in Indiranagar", "description": "Serving professionals since 2018."},
        ],
    },
    "demo-freshfold-hsr": {
        "template_id": "budget",
        "owner_name": "Amit Verma",
        "years_in_business": 5,
        "contact_phone": "+91 98765 43212",
        "whatsapp_number": "+91 98765 43212",
        "show_call": True,
        "show_whatsapp": True,
        "approval_status": "approved",
        "tagline": "Budget-friendly laundry for students and families",
        "brand_primary": "#0f766e",
        "brand_secondary": "#f59e0b",
        "cover_url": "https://images.unsplash.com/photo-1582735680409-38e523e2aabf?auto=format&fit=crop&w=1200&q=80",
        "facilities": ["Wash & Fold", "Eco Friendly Cleaning", "Express Service", "Pickup & Delivery"],
        "highlights": [
            {"title": "Student-Friendly Prices", "description": "Affordable rates without cutting corners."},
            {"title": "Open 7 Days", "description": "Drop off or schedule pickup any day."},
            {"title": "HSR Layout Favourite", "description": "Trusted by families in Sector 1."},
        ],
    },
}

CONTACT_PATCH_KEYS = (
    "contact_phone",
    "whatsapp_number",
    "show_call",
    "show_whatsapp",
    "is_published",
    "approval_status",
)


def _gallery(cover: str, extras: list[str]) -> list[dict]:
    items = [
        {
            "id": str(uuid4()),
            "url": cover,
            "category": "store",
            "sort_order": 0,
            "is_featured": True,
            "caption": "Main store",
        },
    ]
    for i, url in enumerate(extras, start=1):
        items.append(
            {
                "id": str(uuid4()),
                "url": url,
                "category": "machines" if i == 1 else "staff",
                "sort_order": i,
                "is_featured": False,
                "caption": None,
            },
        )
    return items


async def ensure_demo_storefronts() -> None:
    async with AsyncSessionLocal() as session:
        repo = StorefrontRepository(session)
        created = 0
        updated = 0
        for slug, spec in DEMO_STOREFRONTS.items():
            result = await session.execute(select(Laundry).where(Laundry.slug == slug))
            laundry = result.scalar_one_or_none()
            if not laundry:
                continue
            existing = await repo.get_by_laundry(laundry.id)
            if existing:
                patched = False
                for key in CONTACT_PATCH_KEYS:
                    if key in spec and getattr(existing, key) != spec[key]:
                        setattr(existing, key, spec[key])
                        patched = True
                if patched:
                    updated += 1
                continue

            cover = spec.get("cover_url", "")
            gallery = _gallery(
                cover,
                [
                    "https://images.unsplash.com/photo-1610557892470-55d9a53970f0?auto=format&fit=crop&w=800&q=80",
                    "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=800&q=80",
                ],
            )
            payload = {
                **spec,
                "brand_story": laundry.description,
                "working_hours": {"Mon–Sat": "8:00 AM – 9:00 PM", "Sunday": "9:00 AM – 6:00 PM"},
                "pickup_radius_km": Decimal("5"),
                "delivery_radius_km": Decimal("8"),
                "gallery": gallery,
                "videos": [],
                "is_published": True,
            }
            payload["completeness_score"] = compute_completeness(payload)
            session.add(LaundryStorefront(laundry_id=laundry.id, **payload))
            created += 1

        await session.commit()
        if created:
            log.info("db.seed.storefronts", count=created)
        if updated:
            log.info("db.seed.storefronts.updated", count=updated)


async def backfill_storefront_contacts_from_owners() -> None:
    """Copy laundry owner phone into storefronts missing contact_phone."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(LaundryStorefront, User.phone)
            .join(Laundry, Laundry.id == LaundryStorefront.laundry_id)
            .join(User, User.id == Laundry.owner_user_id)
            .where(
                or_(
                    LaundryStorefront.contact_phone.is_(None),
                    LaundryStorefront.contact_phone == "",
                ),
                User.phone.isnot(None),
                User.phone != "",
            ),
        )
        updated = 0
        for storefront, owner_phone in result.all():
            phone = owner_phone.strip()
            if not phone:
                continue
            storefront.contact_phone = phone
            if not (storefront.whatsapp_number or "").strip():
                storefront.whatsapp_number = phone
            storefront.completeness_score = compute_completeness(
                {
                    "logo_url": storefront.logo_url,
                    "cover_url": storefront.cover_url,
                    "tagline": storefront.tagline,
                    "brand_story": storefront.brand_story,
                    "gallery": storefront.gallery or [],
                    "facilities": storefront.facilities or [],
                    "highlights": storefront.highlights or [],
                    "machines": storefront.machines or [],
                    "team": storefront.team or [],
                    "certifications": storefront.certifications or [],
                    "videos": storefront.videos or [],
                    "working_hours": storefront.working_hours,
                    "contact_phone": phone,
                    "owner_name": storefront.owner_name,
                    "years_in_business": storefront.years_in_business,
                },
            )
            updated += 1

        if updated:
            await session.commit()
            log.info("db.seed.storefronts.backfill_contacts", count=updated)
