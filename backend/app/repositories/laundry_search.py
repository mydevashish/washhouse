"""PostgreSQL full-text + trigram laundry search."""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Literal
from uuid import UUID

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import LaundryStatus
from app.models.laundry import Laundry

SearchSort = Literal["relevance", "rating", "name"]


@dataclass(frozen=True)
class LaundrySearchHit:
    laundry: Laundry
    rank_score: float


@dataclass(frozen=True)
class LaundrySearchPage:
    items: list[LaundrySearchHit]
    total: int


def _normalize_query(raw: str) -> str:
    return " ".join(raw.strip().split())[:200]


class LaundrySearchRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def search_approved(
        self,
        *,
        query: str,
        city: str | None = None,
        min_rating: Decimal | None = None,
        sort: SearchSort = "relevance",
        limit: int = 20,
        offset: int = 0,
    ) -> LaundrySearchPage:
        raw_q = _normalize_query(query)
        if not raw_q:
            return LaundrySearchPage(items=[], total=0)

        like_q = f"%{raw_q}%"
        city_like = f"%{city.strip()}%" if city else None

        order_sql = {
            "relevance": "rank_score DESC, l.avg_rating DESC, l.name ASC",
            "rating": "l.avg_rating DESC, rank_score DESC, l.name ASC",
            "name": "l.name ASC, rank_score DESC",
        }[sort]

        base_where = """
            l.deleted_at IS NULL
            AND l.status = :approved_status
            AND (
                l.search_vector @@ websearch_to_tsquery('english', :raw_q)
                OR l.search_vector @@ plainto_tsquery('english', :raw_q)
                OR l.name % :raw_q
                OR similarity(l.name, :raw_q) > 0.25
                OR l.name ILIKE :like_q
                OR l.city ILIKE :like_q
                OR l.address_line ILIKE :like_q
                OR EXISTS (
                    SELECT 1 FROM unnest(l.tags) AS t(tag)
                    WHERE t.tag ILIKE :like_q
                )
            )
        """

        if city_like:
            base_where += " AND l.city ILIKE :city_like"
        if min_rating is not None:
            base_where += " AND l.avg_rating >= :min_rating"

        rank_expr = """
            GREATEST(
                COALESCE(ts_rank_cd(l.search_vector, websearch_to_tsquery('english', :raw_q), 32), 0),
                COALESCE(ts_rank_cd(l.search_vector, plainto_tsquery('english', :raw_q), 16), 0),
                COALESCE(similarity(l.name, :raw_q), 0),
                CASE WHEN l.name ILIKE :like_q THEN 0.45 ELSE 0 END,
                CASE WHEN l.city ILIKE :like_q THEN 0.35 ELSE 0 END
            )
        """

        params = {
            "raw_q": raw_q,
            "like_q": like_q,
            "approved_status": LaundryStatus.approved.value,
            "min_rating": min_rating,
            "city_like": city_like,
            "limit": limit,
            "offset": offset,
        }

        count_sql = text(
            f"""
            SELECT count(*)::int
            FROM laundries l
            WHERE {base_where}
            """
        )
        total = (await self._session.execute(count_sql, params)).scalar_one()

        id_sql = text(
            f"""
            SELECT l.id, {rank_expr} AS rank_score
            FROM laundries l
            WHERE {base_where}
            ORDER BY {order_sql}
            LIMIT :limit OFFSET :offset
            """
        )
        id_rows = (await self._session.execute(id_sql, params)).all()
        if not id_rows:
            return LaundrySearchPage(items=[], total=total)

        id_order: list[UUID] = []
        scores: dict[UUID, float] = {}
        for row in id_rows:
            lid = row[0]
            id_order.append(lid)
            scores[lid] = float(row[1] or 0)

        result = await self._session.execute(select(Laundry).where(Laundry.id.in_(id_order)))
        by_id = {row.id: row for row in result.scalars().all()}

        items = [
            LaundrySearchHit(laundry=by_id[lid], rank_score=scores[lid])
            for lid in id_order
            if lid in by_id
        ]
        return LaundrySearchPage(items=items, total=total)
