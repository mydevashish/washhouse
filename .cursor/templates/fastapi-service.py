# Template: Service layer
# Save as: backend/app/services/<resource>_service.py
from __future__ import annotations

from uuid import UUID

import structlog

from app.core.exceptions import <Resource>NotFoundError
from app.models.user import User
from app.models.<resource> import <Resource>
from app.repositories.<resource>_repo import <Resource>Repository
from app.schemas.<resource> import <Resource>Create, <Resource>ListResponse, <Resource>Response, <Resource>ListMeta

log = structlog.get_logger(__name__)


class <Resource>Service:
    def __init__(self, repo: <Resource>Repository) -> None:
        self.repo = repo

    async def list(
        self,
        *,
        user: User,
        page: int,
        page_size: int,
    ) -> <Resource>ListResponse:
        rows, total = await self.repo.list_for_user(
            user_id=user.id,
            page=page,
            page_size=page_size,
        )
        return <Resource>ListResponse(
            data=[<Resource>Response.model_validate(r) for r in rows],
            meta=<Resource>ListMeta(
                page=page,
                page_size=page_size,
                total=total,
                total_pages=(total + page_size - 1) // page_size,
            ),
        )

    async def get(self, *, user: User, id: UUID) -> <Resource>:
        obj = await self.repo.get(id)
        if obj is None or not self._can_access(user, obj):
            raise <Resource>NotFoundError()
        return obj

    async def create(self, *, user: User, payload: <Resource>Create) -> <Resource>:
        log.info("<resource>.create.start", user_id=str(user.id))
        obj = <Resource>(user_id=user.id, **payload.model_dump())
        await self.repo.add(obj)
        log.info("<resource>.create.ok", user_id=str(user.id), id=str(obj.id))
        return obj

    @staticmethod
    def _can_access(user: User, obj: <Resource>) -> bool:
        # Implement object-level authorization here.
        return obj.user_id == user.id
