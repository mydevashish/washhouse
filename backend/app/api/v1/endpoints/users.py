"""Current user profile and addresses."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Request, Response, status

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_user_payload
from app.schemas.user import (
    AddressCreateRequest,
    AddressUpdateRequest,
    UserUpdateRequest,
)
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me")
async def get_me(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_user_payload)],
) -> dict:
    user = await UserService(session).get_me(UUID(payload["sub"]))
    return success_envelope(user, request)


@router.patch("/me")
async def update_me(
    body: UserUpdateRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_user_payload)],
) -> dict:
    user = await UserService(session).update_me(UUID(payload["sub"]), body)
    return success_envelope(user, request)


@router.get("/me/addresses")
async def list_addresses(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_user_payload)],
) -> dict:
    rows = await UserService(session).list_addresses(UUID(payload["sub"]))
    return success_envelope(rows, request)


@router.post("/me/addresses", status_code=status.HTTP_201_CREATED)
async def create_address(
    body: AddressCreateRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_user_payload)],
) -> dict:
    row = await UserService(session).create_address(UUID(payload["sub"]), body)
    return success_envelope(row, request)


@router.patch("/me/addresses/{address_id}")
async def update_address(
    address_id: UUID,
    body: AddressUpdateRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_user_payload)],
) -> dict:
    row = await UserService(session).update_address(UUID(payload["sub"]), address_id, body)
    return success_envelope(row, request)


@router.delete(
    "/me/addresses/{address_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
async def delete_address(
    address_id: UUID,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_user_payload)],
) -> Response:
    await UserService(session).delete_address(UUID(payload["sub"]), address_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
