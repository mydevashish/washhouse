"""Review management business logic."""

from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthorizationError, NotFoundError, ValidationError
from app.models.enums import AuditAction, ReviewStatus, UserRole
from app.repositories.audit import AuditRepository
from app.repositories.review import ReviewRepository
from app.repositories.review_management import ReviewManagementRepository
from app.services.laundry_trust_score_service import LaundryTrustScoreService


class ReviewManagementService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = ReviewManagementRepository(session)
        self._reviews = ReviewRepository(session)
        self._audit = AuditRepository(session)

    async def _resolve_partner_laundry(self, actor_user_id: UUID, actor_role: str):
        if actor_role == UserRole.partner.value:
            laundry = await self._repo.get_laundry_for_owner(actor_user_id)
            if not laundry:
                raise NotFoundError("Partner laundry not found")
            return laundry
        if actor_role == UserRole.partner_staff.value:
            from app.repositories.staff_management import StaffManagementRepository

            staff = await StaffManagementRepository(session=self._session).get_staff_by_user(actor_user_id)
            if not staff or not staff.is_active:
                raise AuthorizationError()
            laundry = await self._repo.get_laundry(staff.laundry_id)
            if not laundry:
                raise NotFoundError("Laundry not found")
            return laundry
        raise AuthorizationError()

    def _serialize_row(self, review, customer_name: str, laundry_name: str | None = None) -> dict:
        return {
            "id": review.id,
            "laundry_id": review.laundry_id,
            "laundry_name": laundry_name,
            "user_id": review.user_id,
            "customer_name": customer_name,
            "order_id": review.order_id,
            "rating": review.rating,
            "comment": review.comment,
            "status": review.status.value,
            "partner_reply": review.partner_reply,
            "partner_replied_at": review.partner_replied_at,
            "abuse_reported": review.abuse_reported,
            "abuse_reason": review.abuse_reason,
            "is_fake": review.is_fake,
            "moderation_note": review.moderation_note,
            "created_at": review.created_at,
        }

    async def _refresh_laundry_rating(self, laundry_id: UUID) -> None:
        laundry = await self._repo.get_laundry(laundry_id)
        if not laundry:
            return
        avg, count = await self._repo.avg_rating(laundry_id, published_only=True)
        laundry.avg_rating = Decimal(str(round(avg, 2)))
        laundry.review_count = count
        await self._session.flush()
        await LaundryTrustScoreService(self._session).recalculate(laundry_id)

    async def _audit(
        self,
        *,
        action: AuditAction,
        actor_user_id: UUID,
        review_id: UUID,
        old_value: str | None = None,
        new_value: str | None = None,
        note: str | None = None,
    ) -> None:
        await self._audit.log(
            action=action,
            actor_user_id=actor_user_id,
            resource_type="review",
            resource_id=str(review_id),
            metadata={
                "old_value": old_value,
                "new_value": new_value,
                "note": note,
                "source": "review_management",
            },
        )

    async def partner_list_reviews(
        self,
        actor_user_id: UUID,
        actor_role: str,
        *,
        rating: int | None = None,
        min_rating: int | None = None,
        max_rating: int | None = None,
        has_reply: bool | None = None,
        abuse_reported: bool | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[dict]:
        laundry = await self._resolve_partner_laundry(actor_user_id, actor_role)
        rows = await self._repo.list_reviews(
            laundry.id,
            rating=rating,
            min_rating=min_rating,
            max_rating=max_rating,
            has_reply=has_reply,
            abuse_reported=abuse_reported,
            statuses=(ReviewStatus.published, ReviewStatus.pending_moderation, ReviewStatus.hidden),
            limit=limit,
            offset=offset,
        )
        return [self._serialize_row(r, name, laundry.name) for r, name in rows]

    async def partner_analytics(self, actor_user_id: UUID, actor_role: str) -> dict:
        laundry = await self._resolve_partner_laundry(actor_user_id, actor_role)
        avg, count = await self._repo.avg_rating(laundry.id, published_only=True)
        positive, negative = await self._repo.sentiment_counts(laundry.id)
        complaints, praise = await self._repo.theme_counts(laundry.id)
        return {
            "avg_rating": str(Decimal(str(round(avg, 2)))),
            "review_count": count,
            "positive_reviews": positive,
            "negative_reviews": negative,
            "rating_trend": await self._repo.rating_trend(laundry.id),
            "common_complaints": complaints,
            "common_praise": praise,
        }

    async def partner_reply(
        self,
        actor_user_id: UUID,
        actor_role: str,
        review_id: UUID,
        *,
        reply: str,
    ) -> dict:
        laundry = await self._resolve_partner_laundry(actor_user_id, actor_role)
        review = await self._repo.get_review_for_laundry(review_id, laundry.id)
        if not review:
            raise NotFoundError("Review not found")
        if review.status not in (ReviewStatus.published, ReviewStatus.pending_moderation):
            raise ValidationError("Cannot reply to a removed or hidden review")
        cleaned = self._repo.sanitize_reply(reply)
        old = review.partner_reply
        review.partner_reply = cleaned
        review.partner_replied_at = datetime.now(UTC)
        review.partner_replied_by_user_id = actor_user_id
        await self._audit(
            action=AuditAction.review_reply,
            actor_user_id=actor_user_id,
            review_id=review.id,
            old_value=old,
            new_value=cleaned,
        )
        await self._session.flush()
        from app.repositories.user import UserRepository

        customer = await UserRepository(self._session).get_by_id(review.user_id)
        return self._serialize_row(review, customer.full_name if customer else "Customer", laundry.name)

    async def partner_report_abuse(
        self,
        actor_user_id: UUID,
        actor_role: str,
        review_id: UUID,
        *,
        reason: str,
    ) -> dict:
        laundry = await self._resolve_partner_laundry(actor_user_id, actor_role)
        review = await self._repo.get_review_for_laundry(review_id, laundry.id)
        if not review:
            raise NotFoundError("Review not found")
        if review.abuse_reported:
            raise ValidationError("Review already reported")
        review.abuse_reported = True
        review.abuse_reason = reason.strip()[:500]
        review.abuse_reported_at = datetime.now(UTC)
        review.abuse_reported_by_user_id = actor_user_id
        review.status = ReviewStatus.pending_moderation
        await self._audit(
            action=AuditAction.review_abuse_report,
            actor_user_id=actor_user_id,
            review_id=review.id,
            new_value=review.abuse_reason,
        )
        await self._session.flush()
        from app.repositories.user import UserRepository

        customer = await UserRepository(self._session).get_by_id(review.user_id)
        return self._serialize_row(review, customer.full_name if customer else "Customer", laundry.name)

    async def admin_list_reviews(
        self,
        *,
        laundry_id: UUID | None = None,
        status: str | None = None,
        abuse_reported: bool | None = None,
        is_fake: bool | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[dict]:
        status_enum = ReviewStatus(status) if status else None
        rows = await self._repo.list_reviews(
            laundry_id,
            status=status_enum,
            abuse_reported=abuse_reported,
            limit=limit,
            offset=offset,
        )
        result = []
        for review, name in rows:
            if is_fake is not None and review.is_fake != is_fake:
                continue
            laundry = await self._repo.get_laundry(review.laundry_id)
            result.append(self._serialize_row(review, name, laundry.name if laundry else None))
        return result

    async def admin_moderate(
        self,
        actor_user_id: UUID,
        review_id: UUID,
        *,
        action: str,
        note: str | None = None,
    ) -> dict:
        review = await self._repo.get_review(review_id)
        if not review:
            raise NotFoundError("Review not found")
        old_status = review.status.value
        audit_action = AuditAction.review_moderated

        if action == "hide":
            review.status = ReviewStatus.hidden
        elif action == "remove":
            review.status = ReviewStatus.removed
            audit_action = AuditAction.review_removed
        elif action == "restore":
            review.status = ReviewStatus.published
            review.abuse_reported = False
            review.is_fake = False
            audit_action = AuditAction.review_restored
        elif action == "mark_fake":
            review.status = ReviewStatus.removed
            review.is_fake = True
            audit_action = AuditAction.review_removed
        else:
            raise ValidationError("Invalid moderation action")

        review.moderation_note = note
        review.moderated_by_user_id = actor_user_id
        review.moderated_at = datetime.now(UTC)
        await self._audit(
            action=audit_action,
            actor_user_id=actor_user_id,
            review_id=review.id,
            old_value=old_status,
            new_value=review.status.value,
            note=note,
        )
        await self._session.flush()
        await self._refresh_laundry_rating(review.laundry_id)
        from app.repositories.user import UserRepository

        customer = await UserRepository(self._session).get_by_id(review.user_id)
        laundry = await self._repo.get_laundry(review.laundry_id)
        return self._serialize_row(review, customer.full_name if customer else "Customer", laundry.name if laundry else None)

    async def admin_audit_log(self, *, review_id: UUID | None = None, limit: int = 50) -> list[dict]:
        actions = (
            AuditAction.review_reply,
            AuditAction.review_abuse_report,
            AuditAction.review_moderated,
            AuditAction.review_removed,
            AuditAction.review_restored,
        )
        rows = []
        for action in actions:
            part = await self._audit.list_logs(
                limit=limit,
                action=action,
                resource_type="review",
                resource_id=str(review_id) if review_id else None,
            )
            rows.extend(part)
        rows.sort(key=lambda r: r["timestamp"], reverse=True)
        return [
            {
                "id": r["id"],
                "timestamp": r["timestamp"].isoformat() if hasattr(r["timestamp"], "isoformat") else str(r["timestamp"]),
                "user_name": r["user_name"],
                "action": r["action"],
                "review_id": r.get("resource_id") or "",
                "old_value": r.get("old_value"),
                "new_value": r.get("new_value"),
                "note": (r.get("metadata") or {}).get("note"),
            }
            for r in rows[:limit]
        ]

    async def admin_dashboard(self) -> dict:
        queue = await self._repo.moderation_queue_count()
        from app.models.review import Review as ReviewModel

        reported = int(
            await self._session.scalar(
                select(func.count()).select_from(ReviewModel).where(ReviewModel.abuse_reported.is_(True)),
            )
            or 0,
        )
        return {"moderation_queue": queue, "abuse_reported_total": reported}
