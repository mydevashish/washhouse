"""Storefront builder business logic."""

from __future__ import annotations

from copy import deepcopy
from decimal import Decimal
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.enums import LaundryStatus
from app.models.storefront import LaundryStorefront
from app.models.user import User
from app.repositories.laundry import LaundryRepository
from app.repositories.storefront import StorefrontRepository
from app.schemas.storefront import StorefrontHighlight, StorefrontUpdateRequest

FACILITY_OPTIONS = [
    "Steam Iron",
    "Express Service",
    "Premium Care",
    "Eco Friendly",
    "Commercial Machines",
    "Same Day Delivery",
    "24 Hour Delivery",
    "Pickup & Delivery",
    "Dry Cleaning",
    "Stain Removal Specialists",
    "Blanket Cleaning",
    "Curtain Cleaning",
]

GALLERY_CATEGORIES = [
    "store",
    "machines",
    "staff",
    "packaging",
    "vehicle",
    "certificates",
    "before_after",
]

STOREFRONT_TEMPLATES: dict[str, dict[str, Any]] = {
    "premium": {
        "name": "Premium Laundry",
        "description": "Upscale positioning with trust and quality emphasis.",
        "brand_primary": "#1e3a5f",
        "brand_secondary": "#c9a227",
        "facilities": ["Premium Care", "Dry Cleaning", "Steam Iron", "Premium Packaging"],
        "highlights": [
            {"title": "15 Years Experience", "description": "Trusted by thousands of families."},
            {"title": "Premium Packaging", "description": "Garments returned fresh and neatly packed."},
            {"title": "Imported Machines", "description": "Commercial-grade equipment for consistent results."},
        ],
    },
    "budget": {
        "name": "Budget Laundry",
        "description": "Value-focused storefront for price-conscious customers.",
        "brand_primary": "#0f766e",
        "brand_secondary": "#f59e0b",
        "facilities": ["Wash & Fold", "Eco Friendly Cleaning", "Express Service"],
        "highlights": [
            {"title": "Lowest Prices", "description": "Affordable rates without compromising hygiene."},
            {"title": "Free Pickup", "description": "Doorstep collection on every order."},
            {"title": "10,000+ Orders", "description": "Proven reliability in your neighbourhood."},
        ],
    },
    "express": {
        "name": "Express Delivery",
        "description": "Speed and convenience as the primary promise.",
        "brand_primary": "#dc2626",
        "brand_secondary": "#1d4ed8",
        "facilities": ["Same Day Delivery", "Express Service", "Steam Iron"],
        "highlights": [
            {"title": "Same Day Delivery", "description": "Book morning, wear evening."},
            {"title": "Live Tracking", "description": "Know exactly where your order is."},
            {"title": "24/7 Support", "description": "We're here when you need us."},
        ],
    },
    "eco": {
        "name": "Eco-Friendly Laundry",
        "description": "Sustainable cleaning for conscious customers.",
        "brand_primary": "#166534",
        "brand_secondary": "#84cc16",
        "facilities": ["Eco Friendly Cleaning", "Premium Care", "Stain Removal Specialists"],
        "highlights": [
            {"title": "Planet-Safe Detergents", "description": "Biodegradable, hypoallergenic formulas."},
            {"title": "Water-Efficient Process", "description": "Less water per kg than traditional shops."},
            {"title": "Certified Green", "description": "Eco practices you can trust."},
        ],
    },
    "luxury": {
        "name": "Luxury Garment Care",
        "description": "Designer and delicate fabric specialists.",
        "brand_primary": "#312e81",
        "brand_secondary": "#a78bfa",
        "facilities": ["Premium Care", "Dry Cleaning", "Stain Removal Specialists", "Curtain Cleaning"],
        "highlights": [
            {"title": "Designer Garment Experts", "description": "Silk, wool, and couture handled with care."},
            {"title": "Hand Finishing", "description": "Detail work machines cannot replicate."},
            {"title": "Insured Handling", "description": "Peace of mind for high-value items."},
        ],
    },
}


def resolve_guest_contact_fields(
    storefront: LaundryStorefront | None,
    *,
    laundry_approved: bool,
) -> dict[str, str | bool | None]:
    if not laundry_approved or storefront is None:
        return {
            "phone": None,
            "whatsapp_number": None,
            "show_call": False,
            "show_whatsapp": False,
        }
    return storefront.guest_contact_fields()


def compute_completeness(data: dict[str, Any]) -> int:
    score = 0
    if data.get("logo_url"):
        score += 5
    if data.get("cover_url"):
        score += 10
    if data.get("tagline"):
        score += 5
    if data.get("brand_story"):
        score += 10
    gallery = data.get("gallery") or []
    if len(gallery) >= 3:
        score += 15
    elif len(gallery) >= 1:
        score += 8
    facilities = data.get("facilities") or []
    if len(facilities) >= 3:
        score += 10
    elif facilities:
        score += 5
    highlights = data.get("highlights") or []
    if len(highlights) >= 2:
        score += 10
    elif highlights:
        score += 5
    machines = data.get("machines") or []
    if machines:
        score += 10
    team = data.get("team") or []
    if team:
        score += 5
    certs = data.get("certifications") or []
    if certs:
        score += 10
    if data.get("working_hours"):
        score += 5
    if data.get("contact_phone"):
        score += 5
    if data.get("owner_name"):
        score += 5
    if data.get("years_in_business"):
        score += 5
    videos = data.get("videos") or []
    if videos:
        score += 5
    return min(100, score)


def _default_gallery(cover: str | None, extra: list[str]) -> list[dict]:
    items: list[dict] = []
    order = 0
    if cover:
        items.append(
            {
                "id": str(uuid4()),
                "url": cover,
                "category": "store",
                "sort_order": order,
                "is_featured": True,
                "caption": "Storefront",
            },
        )
        order += 1
    for url in extra:
        items.append(
            {
                "id": str(uuid4()),
                "url": url,
                "category": "store",
                "sort_order": order,
                "is_featured": False,
                "caption": None,
            },
        )
        order += 1
    return items


class StorefrontService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._laundries = LaundryRepository(session)
        self._storefronts = StorefrontRepository(session)

    def list_templates(self) -> list[dict]:
        return [
            {
                "id": tid,
                "name": meta["name"],
                "description": meta["description"],
                "brand_primary": meta["brand_primary"],
                "brand_secondary": meta["brand_secondary"],
                "sample_facilities": meta["facilities"],
                "sample_highlights": meta["highlights"],
            }
            for tid, meta in STOREFRONT_TEMPLATES.items()
        ]

    async def _require_partner_laundry(self, partner_user_id: UUID):
        laundry = await self._laundries.get_by_owner(partner_user_id)
        if not laundry:
            raise NotFoundError("Laundry not found for this partner")
        return laundry

    async def get_for_partner(self, partner_user_id: UUID) -> dict:
        laundry = await self._require_partner_laundry(partner_user_id)
        row = await self._storefronts.get_by_laundry(laundry.id)
        if not row:
            row = await self._create_default(laundry)
        return self._to_dict(row, laundry)

    async def get_or_create_for_laundry(self, laundry) -> LaundryStorefront:
        row = await self._storefronts.get_by_laundry(laundry.id)
        if not row:
            row = await self._create_default(laundry)
        return row

    async def get_public(self, laundry_id: UUID) -> dict:
        laundry = await self._laundries.get_by_id(laundry_id)
        if not laundry:
            raise NotFoundError("Laundry not found")
        row = await self._storefronts.get_by_laundry(laundry_id)
        if not row:
            row = await self._create_default(laundry)
        if not row.is_published or row.approval_status == "rejected":
            raise NotFoundError("Storefront not available")
        orders_completed = await self._storefronts.count_completed_orders(laundry_id)
        active_services = [
            s for s in laundry.services
            if s.is_active and s.deleted_at is None and s.catalog_status == "active"
        ]
        return {
            "storefront": self._to_dict(row, laundry),
            "laundry": laundry,
            "orders_completed": orders_completed,
            "services": active_services,
        }

    async def update_for_partner(
        self,
        partner_user_id: UUID,
        body: StorefrontUpdateRequest,
    ) -> dict:
        laundry = await self._require_partner_laundry(partner_user_id)
        row = await self._storefronts.get_by_laundry(laundry.id)
        if not row:
            row = await self._create_default(laundry)

        patch = body.model_dump(exclude_unset=True)
        for key, value in patch.items():
            if key in ("highlights", "gallery", "machines", "team", "certifications", "videos"):
                setattr(row, key, [v.model_dump() if hasattr(v, "model_dump") else v for v in value])
            else:
                setattr(row, key, value)

        data = self._row_payload(row)
        row.completeness_score = compute_completeness(data)
        await self._storefronts.upsert(row)
        await self._session.flush()
        return self._to_dict(row, laundry)

    async def apply_template(self, partner_user_id: UUID, template_id: str) -> dict:
        if template_id not in STOREFRONT_TEMPLATES:
            raise NotFoundError("Unknown template")
        meta = STOREFRONT_TEMPLATES[template_id]
        body = StorefrontUpdateRequest(
            template_id=template_id,
            brand_primary=meta["brand_primary"],
            brand_secondary=meta["brand_secondary"],
            facilities=meta["facilities"],
            highlights=[StorefrontHighlight(**h) for h in meta["highlights"]],
        )
        return await self.update_for_partner(partner_user_id, body)

    async def _resolve_owner_contact(self, laundry) -> tuple[str | None, str | None]:
        result = await self._session.execute(
            select(User.phone, User.full_name).where(User.id == laundry.owner_user_id),
        )
        row = result.one_or_none()
        if not row:
            return None, None
        phone = (row.phone or "").strip() or None
        owner_name = (row.full_name or "").strip() or None
        return phone, owner_name

    async def _create_default(self, laundry) -> LaundryStorefront:
        contact_phone, owner_name = await self._resolve_owner_contact(laundry)
        cover = "https://images.unsplash.com/photo-1582735680409-38e523e2aabf?auto=format&fit=crop&w=1200&q=80"
        gallery_urls = [
            "https://images.unsplash.com/photo-1610557892470-55d9a53970f0?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=800&q=80",
        ]
        payload = {
            "template_id": "premium",
            "is_published": True,
            "approval_status": "approved",
            "show_call": True,
            "show_whatsapp": True,
            "show_callback": True,
            "cover_url": cover,
            "tagline": laundry.description[:120] if laundry.description else "Quality laundry, delivered.",
            "brand_story": laundry.description,
            "owner_name": owner_name,
            "contact_phone": contact_phone,
            "whatsapp_number": contact_phone,
            "working_hours": {
                "Mon–Sat": "8:00 AM – 9:00 PM",
                "Sunday": "9:00 AM – 6:00 PM",
            },
            "pickup_radius_km": Decimal("5"),
            "delivery_radius_km": Decimal("8"),
            "facilities": ["Steam Iron", "Dry Cleaning", "Same Day Delivery"],
            "highlights": [
                {"title": "Trusted Local Partner", "description": "Serving your neighbourhood with care."},
                {"title": "Free Pickup & Delivery", "description": "Doorstep service at no extra hassle."},
            ],
            "gallery": _default_gallery(cover, gallery_urls),
            "machines": [],
            "team": [],
            "certifications": [],
            "videos": [],
        }
        payload["completeness_score"] = compute_completeness(payload)
        row = LaundryStorefront(laundry_id=laundry.id, **payload)
        return await self._storefronts.upsert(row)

    def _row_payload(self, row: LaundryStorefront) -> dict[str, Any]:
        return {
            "logo_url": row.logo_url,
            "cover_url": row.cover_url,
            "tagline": row.tagline,
            "brand_story": row.brand_story,
            "gallery": row.gallery or [],
            "facilities": row.facilities or [],
            "highlights": row.highlights or [],
            "machines": row.machines or [],
            "team": row.team or [],
            "certifications": row.certifications or [],
            "videos": row.videos or [],
            "working_hours": row.working_hours,
            "contact_phone": row.contact_phone,
            "owner_name": row.owner_name,
            "years_in_business": row.years_in_business,
        }

    def _to_dict(self, row: LaundryStorefront, laundry) -> dict:
        return {
            "laundry_id": row.laundry_id,
            "template_id": row.template_id,
            "is_published": row.is_published,
            "logo_url": row.logo_url,
            "cover_url": row.cover_url,
            "brand_primary": row.brand_primary,
            "brand_secondary": row.brand_secondary,
            "tagline": row.tagline,
            "brand_story": row.brand_story or laundry.description,
            "years_in_business": row.years_in_business,
            "owner_name": row.owner_name,
            "contact_phone": row.contact_phone,
            "whatsapp_number": row.whatsapp_number,
            "show_call": row.show_call,
            "show_whatsapp": row.show_whatsapp,
            "show_callback": row.show_callback,
            "approval_status": row.approval_status,
            "working_hours": row.working_hours,
            "pickup_radius_km": row.pickup_radius_km,
            "delivery_radius_km": row.delivery_radius_km,
            "facilities": row.facilities or [],
            "highlights": row.highlights or [],
            "gallery": sorted(row.gallery or [], key=lambda g: g.get("sort_order", 0)),
            "machines": row.machines or [],
            "team": row.team or [],
            "certifications": row.certifications or [],
            "videos": row.videos or [],
            "completeness_score": row.completeness_score,
        }
