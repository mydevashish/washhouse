"""Audit log persistence."""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.pagination import apply_sort
from app.models.audit_log import AuditLog
from app.models.enums import AuditAction, UserRole
from app.models.user import User


class AuditRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def log(
        self,
        *,
        action: AuditAction,
        actor_user_id: UUID | None = None,
        resource_type: str | None = None,
        resource_id: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        entry = AuditLog(
            action=action,
            actor_user_id=actor_user_id,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata_json=metadata,
        )
        self._session.add(entry)
        await self._session.flush()

    async def list_logs(
        self,
        *,
        limit: int = 100,
        offset: int = 0,
        action: AuditAction | None = None,
        resource_type: str | None = None,
        resource_id: str | None = None,
        actor_user_id: UUID | None = None,
        since: datetime | None = None,
        until: datetime | None = None,
    ) -> list[dict]:
        q = (
            select(AuditLog, User.full_name, User.role, User.email)
            .outerjoin(User, User.id == AuditLog.actor_user_id)
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        if action is not None:
            q = q.where(AuditLog.action == action)
        if resource_type:
            q = q.where(AuditLog.resource_type == resource_type)
        if resource_id:
            q = q.where(AuditLog.resource_id == resource_id)
        if actor_user_id:
            q = q.where(AuditLog.actor_user_id == actor_user_id)
        if since is not None:
            q = q.where(AuditLog.created_at >= since)
        if until is not None:
            q = q.where(AuditLog.created_at <= until)

        result = await self._session.execute(q)
        rows: list[dict] = []
        for log, name, role, email in result.all():
            meta = log.metadata_json or {}
            rows.append(
                {
                    "id": str(log.id),
                    "timestamp": log.created_at,
                    "user_name": name or "System",
                    "user_email": email,
                    "role": role.value if isinstance(role, UserRole) else str(role) if role else None,
                    "entity": log.resource_type or "—",
                    "action": log.action.value,
                    "old_value": meta.get("old_value"),
                    "new_value": meta.get("new_value"),
                    "ip_address": log.ip_address,
                    "source": meta.get("source") or log.user_agent or "api",
                    "resource_id": log.resource_id,
                    "metadata": meta,
                },
            )
        return rows

    def _base_query(
        self,
        *,
        action: AuditAction | str | None = None,
        resource_type: str | None = None,
        resource_id: str | None = None,
        actor_user_id: UUID | None = None,
        since: datetime | None = None,
        until: datetime | None = None,
        search: str | None = None,
    ):
        q = select(AuditLog, User.full_name, User.role, User.email).outerjoin(
            User,
            User.id == AuditLog.actor_user_id,
        )
        if action is not None:
            act = AuditAction(action) if isinstance(action, str) else action
            q = q.where(AuditLog.action == act)
        if resource_type:
            q = q.where(AuditLog.resource_type == resource_type)
        if resource_id:
            q = q.where(AuditLog.resource_id == resource_id)
        if actor_user_id:
            q = q.where(AuditLog.actor_user_id == actor_user_id)
        if since is not None:
            q = q.where(AuditLog.created_at >= since)
        if until is not None:
            q = q.where(AuditLog.created_at <= until)
        if search:
            term = f"%{search}%"
            q = q.where(
                or_(
                    User.full_name.ilike(term),
                    User.email.ilike(term),
                    AuditLog.action.ilike(term),
                    AuditLog.resource_type.ilike(term),
                    AuditLog.resource_id.ilike(term),
                ),
            )
        return q

    def _row_dict(self, log, name, role, email) -> dict:
        meta = log.metadata_json or {}
        return {
            "id": str(log.id),
            "timestamp": log.created_at,
            "user_name": name or "System",
            "user_email": email,
            "role": role.value if isinstance(role, UserRole) else str(role) if role else None,
            "entity": log.resource_type or "—",
            "action": log.action.value,
            "old_value": meta.get("old_value"),
            "new_value": meta.get("new_value"),
            "ip_address": log.ip_address,
            "source": meta.get("source") or log.user_agent or "api",
            "resource_id": log.resource_id,
            "metadata": meta,
        }

    async def list_logs_paginated(
        self,
        *,
        page: int,
        page_size: int,
        sort_by: str | None = None,
        sort_order: str = "desc",
        action: AuditAction | str | None = None,
        resource_type: str | None = None,
        resource_id: str | None = None,
        actor_user_id: UUID | None = None,
        since: datetime | None = None,
        until: datetime | None = None,
        search: str | None = None,
    ) -> tuple[list[dict], int]:
        q = self._base_query(
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            actor_user_id=actor_user_id,
            since=since,
            until=until,
            search=search,
        )
        sort_map = {
            "created_at": AuditLog.created_at,
            "timestamp": AuditLog.created_at,
            "user_name": User.full_name,
            "action": AuditLog.action,
            "entity": AuditLog.resource_type,
        }
        q = apply_sort(q, sort_by, sort_order, column_map=sort_map, default=AuditLog.created_at)
        count_stmt = select(func.count()).select_from(q.order_by(None).subquery())
        total = int(await self._session.scalar(count_stmt) or 0)
        result = await self._session.execute(
            q.offset((max(1, page) - 1) * page_size).limit(page_size),
        )
        rows = [self._row_dict(log, name, role, email) for log, name, role, email in result.all()]
        return rows, total
