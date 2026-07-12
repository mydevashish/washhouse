# Template: Repository layer
# Save as: backend/app/repositories/<resource>_repo.py
from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.<resource> import <Resource>


class <Resource>Repository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get(self, id: UUID) -> <Resource> | None:
        stmt = select(<Resource>).where(
            <Resource>.id == id,
            <Resource>.deleted_at.is_(None),
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_for_user(
        self,
        *,
        user_id: UUID,
        page: int,
        page_size: int,
    ) -> tuple[list[<Resource>], int]:
        base = select(<Resource>).where(
            <Resource>.user_id == user_id,
            <Resource>.deleted_at.is_(None),
        )
        total = await self.session.scalar(select(func.count()).select_from(base.subquery()))
        rows = await self.session.execute(
            base.order_by(<Resource>.created_at.desc())
                .limit(page_size)
                .offset((page - 1) * page_size)
        )
        return list(rows.scalars().all()), int(total or 0)

    async def add(self, obj: <Resource>) -> <Resource>:
        self.session.add(obj)
        await self.session.flush()
        return obj
