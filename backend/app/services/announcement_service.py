"""Announcement center business logic."""

from __future__ import annotations

import structlog
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, ValidationError
from app.models.announcement import Announcement
from app.models.enums import (
    AnnouncementEventType,
    AnnouncementStatus,
    AnnouncementTarget,
    AuditAction,
)
from app.models.notification import Notification
from app.repositories.announcement import AnnouncementRepository
from app.repositories.audit import AuditRepository
from app.repositories.user import UserRepository
from app.services.email_service import EmailService
from app.services.notifications.dispatch import is_channel_enabled

log = structlog.get_logger(__name__)


class AnnouncementService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = AnnouncementRepository(session)
        self._audit = AuditRepository(session)
        self._users = UserRepository(session)

    def _serialize(self, row: Announcement) -> dict:
        return {
            "id": row.id,
            "title": row.title,
            "body": row.body,
            "status": row.status.value,
            "target_type": row.target_type.value,
            "target_laundry_ids": list(row.target_laundry_ids or []),
            "target_cities": list(row.target_cities or []),
            "channel_in_app": row.channel_in_app,
            "channel_email": row.channel_email,
            "channel_push": row.channel_push,
            "action_url": row.action_url,
            "requires_acknowledgement": row.requires_acknowledgement,
            "scheduled_at": row.scheduled_at,
            "published_at": row.published_at,
            "archived_at": row.archived_at,
            "view_count": row.view_count,
            "click_count": row.click_count,
            "acknowledgement_count": row.acknowledgement_count,
            "created_at": row.created_at,
            "updated_at": row.updated_at,
        }

    async def _audit(
        self,
        *,
        action: AuditAction,
        actor_user_id: UUID,
        announcement_id: UUID,
        note: str | None = None,
    ) -> None:
        await self._audit.log(
            action=action,
            actor_user_id=actor_user_id,
            resource_type="announcement",
            resource_id=str(announcement_id),
            metadata={"source": "announcement_center", "note": note},
        )

    async def _dispatch_channels(self, announcement: Announcement) -> None:
        user_ids = await self._repo.resolve_targeted_user_ids(announcement)
        if announcement.channel_email and await is_channel_enabled(self._session, "email"):
            # Bulk announcement email needs per-user addresses + templates (Phase 5+).
            # Log clearly so ops do not confuse this with SMTP contact/franchise mail.
            email = EmailService()
            log.info(
                "announcement.email_dispatch",
                announcement_id=str(announcement.id),
                recipients=len(user_ids),
                smtp_configured=email.is_configured,
                status="stub_pending_bulk_sender",
            )
        if announcement.channel_push and await is_channel_enabled(self._session, "push"):
            log.info("announcement.push_dispatch", announcement_id=str(announcement.id), recipients=len(user_ids))
        if announcement.channel_in_app and await is_channel_enabled(self._session, "in_app"):
            for uid in user_ids[:500]:
                self._session.add(
                    Notification(
                        user_id=uid,
                        title=announcement.title,
                        body=announcement.body[:500],
                    ),
                )
            await self._session.flush()

    async def publish_due_scheduled(self) -> int:
        now = datetime.now(UTC)
        due = await self._repo.list_due_scheduled(now)
        for row in due:
            row.status = AnnouncementStatus.published
            row.published_at = now
            await self._dispatch_channels(row)
        await self._session.flush()
        return len(due)

    async def admin_list(
        self,
        *,
        status: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> dict:
        status_enum = AnnouncementStatus(status) if status else None
        rows = await self._repo.list_admin(status=status_enum, limit=limit, offset=offset)
        total = await self._repo.count_admin(status=status_enum)
        return {
            "items": [self._serialize(r) for r in rows],
            "total": total,
            "limit": limit,
            "offset": offset,
        }

    async def admin_get(self, announcement_id: UUID) -> dict:
        row = await self._repo.get(announcement_id)
        if not row:
            raise NotFoundError("Announcement not found")
        return self._serialize(row)

    async def admin_create(self, actor_user_id: UUID, data: dict) -> dict:
        status = AnnouncementStatus.scheduled if data.get("scheduled_at") else AnnouncementStatus.draft
        row = Announcement(
            title=data["title"],
            body=data["body"],
            status=status,
            target_type=AnnouncementTarget(data["target_type"]),
            target_laundry_ids=list(data.get("target_laundry_ids") or []),
            target_cities=[c.strip() for c in data.get("target_cities") or [] if c.strip()],
            channel_in_app=data.get("channel_in_app", True),
            channel_email=data.get("channel_email", False),
            channel_push=data.get("channel_push", False),
            action_url=data.get("action_url"),
            requires_acknowledgement=data.get("requires_acknowledgement", False),
            scheduled_at=data.get("scheduled_at"),
            created_by_user_id=actor_user_id,
        )
        await self._repo.create(row)
        await self._audit(action=AuditAction.announcement_created, actor_user_id=actor_user_id, announcement_id=row.id)
        if status == AnnouncementStatus.scheduled:
            await self._audit(action=AuditAction.announcement_scheduled, actor_user_id=actor_user_id, announcement_id=row.id)
        return self._serialize(row)

    async def admin_update(self, actor_user_id: UUID, announcement_id: UUID, data: dict) -> dict:
        row = await self._repo.get(announcement_id)
        if not row:
            raise NotFoundError("Announcement not found")
        if row.status == AnnouncementStatus.archived:
            raise ValidationError("Cannot edit archived announcements")
        if row.status == AnnouncementStatus.published:
            raise ValidationError("Archive published announcements before editing")
        for key in ("title", "body", "action_url", "requires_acknowledgement", "channel_in_app", "channel_email", "channel_push"):
            if key in data and data[key] is not None:
                setattr(row, key, data[key])
        if data.get("target_type"):
            row.target_type = AnnouncementTarget(data["target_type"])
        if data.get("target_laundry_ids") is not None:
            row.target_laundry_ids = list(data["target_laundry_ids"])
        if data.get("target_cities") is not None:
            row.target_cities = [c.strip() for c in data["target_cities"] if c.strip()]
        if data.get("scheduled_at") is not None:
            row.scheduled_at = data["scheduled_at"]
            if row.status == AnnouncementStatus.draft:
                row.status = AnnouncementStatus.scheduled
        await self._session.flush()
        await self._audit(action=AuditAction.announcement_updated, actor_user_id=actor_user_id, announcement_id=row.id)
        return self._serialize(row)

    async def admin_publish(self, actor_user_id: UUID, announcement_id: UUID) -> dict:
        row = await self._repo.get(announcement_id)
        if not row:
            raise NotFoundError("Announcement not found")
        if row.status == AnnouncementStatus.published:
            raise ValidationError("Already published")
        if row.status == AnnouncementStatus.archived:
            raise ValidationError("Cannot publish archived announcements")
        now = datetime.now(UTC)
        row.status = AnnouncementStatus.published
        row.published_at = now
        row.scheduled_at = None
        await self._dispatch_channels(row)
        await self._session.flush()
        await self._audit(action=AuditAction.announcement_published, actor_user_id=actor_user_id, announcement_id=row.id)
        return self._serialize(row)

    async def admin_schedule(self, actor_user_id: UUID, announcement_id: UUID, scheduled_at: datetime) -> dict:
        row = await self._repo.get(announcement_id)
        if not row:
            raise NotFoundError("Announcement not found")
        if row.status == AnnouncementStatus.published:
            raise ValidationError("Cannot schedule a published announcement")
        if scheduled_at <= datetime.now(UTC):
            raise ValidationError("scheduled_at must be in the future")
        row.status = AnnouncementStatus.scheduled
        row.scheduled_at = scheduled_at
        await self._session.flush()
        await self._audit(action=AuditAction.announcement_scheduled, actor_user_id=actor_user_id, announcement_id=row.id)
        return self._serialize(row)

    async def admin_archive(self, actor_user_id: UUID, announcement_id: UUID) -> dict:
        row = await self._repo.get(announcement_id)
        if not row:
            raise NotFoundError("Announcement not found")
        row.status = AnnouncementStatus.archived
        row.archived_at = datetime.now(UTC)
        await self._session.flush()
        await self._audit(action=AuditAction.announcement_archived, actor_user_id=actor_user_id, announcement_id=row.id)
        return self._serialize(row)

    async def user_active(self, user_id: UUID) -> list[dict]:
        await self.publish_due_scheduled()
        user = await self._users.get_by_id(user_id)
        if not user:
            return []
        published = await self._repo.list_published()
        results: list[dict] = []
        for row in published:
            if not row.channel_in_app:
                continue
            if not await self._repo.user_matches_target(user, row):
                continue
            viewed = await self._repo.user_has_event(row.id, user_id, AnnouncementEventType.view)
            acknowledged = await self._repo.user_has_event(row.id, user_id, AnnouncementEventType.acknowledge)
            if row.requires_acknowledgement and acknowledged:
                continue
            results.append(
                {
                    "id": row.id,
                    "title": row.title,
                    "body": row.body,
                    "action_url": row.action_url,
                    "requires_acknowledgement": row.requires_acknowledgement,
                    "published_at": row.published_at,
                    "viewed": viewed,
                    "acknowledged": acknowledged,
                },
            )
        return results

    async def record_event(self, user_id: UUID, announcement_id: UUID, event_type: str) -> dict:
        row = await self._repo.get(announcement_id)
        if not row or row.status != AnnouncementStatus.published:
            raise NotFoundError("Announcement not found")
        user = await self._users.get_by_id(user_id)
        if not user or not await self._repo.user_matches_target(user, row):
            raise NotFoundError("Announcement not found")
        et = AnnouncementEventType(event_type)
        incremented = await self._repo.record_event(
            announcement_id=announcement_id,
            user_id=user_id,
            event_type=et,
        )
        if incremented:
            if et == AnnouncementEventType.view:
                row.view_count += 1
            elif et == AnnouncementEventType.click:
                row.click_count += 1
            elif et == AnnouncementEventType.acknowledge:
                row.acknowledgement_count += 1
            await self._session.flush()
        return {
            "recorded": True,
            "view_count": row.view_count,
            "click_count": row.click_count,
            "acknowledgement_count": row.acknowledgement_count,
        }
