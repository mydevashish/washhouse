# Template: FastAPI endpoint module
# Save as: backend/app/api/v1/endpoints/<resource>.py
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.api.v1.deps import get_current_user, get_<resource>_service
from app.models.user import User
from app.schemas.<resource> import <Resource>Create, <Resource>Response, <Resource>ListResponse
from app.services.<resource>_service import <Resource>Service

router = APIRouter(prefix="/<resource_plural>", tags=["<resource_plural>"])


@router.get(
    "",
    response_model=<Resource>ListResponse,
    summary="List <resource_plural>",
    description="Paginated list visible to the current user.",
)
async def list_<resource_plural>(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    service: <Resource>Service = Depends(get_<resource>_service),
) -> <Resource>ListResponse:
    return await service.list(user=current_user, page=page, page_size=page_size)


@router.post(
    "",
    response_model=<Resource>Response,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new <resource>",
    responses={
        409: {"description": "Conflict"},
        422: {"description": "Validation error"},
    },
)
async def create_<resource>(
    payload: <Resource>Create,
    current_user: User = Depends(get_current_user),
    service: <Resource>Service = Depends(get_<resource>_service),
) -> <Resource>Response:
    obj = await service.create(user=current_user, payload=payload)
    return <Resource>Response.model_validate(obj)


@router.get(
    "/{<resource>_id}",
    response_model=<Resource>Response,
    summary="Get one <resource>",
)
async def get_<resource>(
    <resource>_id: UUID,
    current_user: User = Depends(get_current_user),
    service: <Resource>Service = Depends(get_<resource>_service),
) -> <Resource>Response:
    obj = await service.get(user=current_user, id=<resource>_id)
    return <Resource>Response.model_validate(obj)
