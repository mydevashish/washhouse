"""Public platform catalog marketplace “from ₹” aggregates."""

from __future__ import annotations

from fastapi import APIRouter, Query, Request, Response

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep
from app.core.config import settings
from app.models.enums import CatalogCategory
from app.services.marketplace_from_service import MarketplaceFromService

router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.get("/marketplace-from")
async def get_marketplace_from(
    request: Request,
    response: Response,
    session: SessionDep,
    category: CatalogCategory | None = Query(
        default=None,
        description="Optional catalog category filter",
    ),
) -> dict:
    """Per-item min “from” prices across approved partners, with suggested fallback."""
    data = await MarketplaceFromService(session).get_marketplace_from(category=category)
    response.headers["Cache-Control"] = (
        f"public, max-age={settings.CACHE_MARKETPLACE_FROM_TTL_SEC}"
    )
    return success_envelope(data, request)
