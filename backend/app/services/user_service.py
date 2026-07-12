"""User profile and address business logic."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, ValidationError
from app.models.user_address import UserAddress
from app.repositories.address import AddressRepository
from app.repositories.user import UserRepository
from app.schemas.user import (
    AddressCreateRequest,
    AddressResponse,
    AddressUpdateRequest,
    UserResponse,
    UserUpdateRequest,
)


class UserService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._users = UserRepository(session)
        self._addresses = AddressRepository(session)

    async def get_me(self, user_id: UUID) -> UserResponse:
        user = await self._users.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        return UserResponse.model_validate(user)

    async def update_me(self, user_id: UUID, payload: UserUpdateRequest) -> UserResponse:
        user = await self._users.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        if payload.full_name is not None:
            user.full_name = payload.full_name
        await self._users.update(user)
        return UserResponse.model_validate(user)

    async def list_addresses(self, user_id: UUID) -> list[AddressResponse]:
        rows = await self._addresses.list_for_user(user_id)
        return [AddressResponse.model_validate(r) for r in rows]

    async def create_address(
        self,
        user_id: UUID,
        payload: AddressCreateRequest,
    ) -> AddressResponse:
        if payload.is_default:
            await self._addresses.clear_default(user_id)

        address = UserAddress(user_id=user_id, **payload.model_dump())
        created = await self._addresses.create(address)
        return AddressResponse.model_validate(created)

    async def update_address(
        self,
        user_id: UUID,
        address_id: UUID,
        payload: AddressUpdateRequest,
    ) -> AddressResponse:
        address = await self._addresses.get_by_id(address_id, user_id)
        if not address:
            raise NotFoundError("Address not found")

        data = payload.model_dump(exclude_unset=True)
        if data.get("is_default"):
            await self._addresses.clear_default(user_id)

        for key, value in data.items():
            setattr(address, key, value)
        return AddressResponse.model_validate(address)

    async def delete_address(self, user_id: UUID, address_id: UUID) -> None:
        address = await self._addresses.get_by_id(address_id, user_id)
        if not address:
            raise NotFoundError("Address not found")
        if address.is_default:
            raise ValidationError("Cannot delete default address; set another as default first")
        await self._addresses.delete(address)
