"""Marketing site business logic — public contact, franchise, stats, testimonials."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import EmailDeliveryError, EmailNotConfiguredError, RateLimitError
from app.models.marketing import MarketingContactSubmission, MarketingFranchiseInquiry
from app.repositories.marketing_repository import MarketingRepository
from app.schemas.marketing import (
    MarketingContactCreate,
    MarketingFranchiseInquiryCreate,
    MarketingPublicStatsResponse,
    MarketingSubmissionResponse,
    MarketingTestimonialResponse,
)
from app.services.email_service import EmailService

log = structlog.get_logger(__name__)

CONTACT_IP_LIMIT = 5
CONTACT_PHONE_LIMIT = 3
CONTACT_WINDOW = timedelta(hours=1)
FRANCHISE_IP_LIMIT = 3
FRANCHISE_WINDOW = timedelta(hours=1)


class MarketingService:
    def __init__(self, session: AsyncSession, email: EmailService | None = None) -> None:
        self._session = session
        self._repo = MarketingRepository(session)
        self._email = email or EmailService()

    async def submit_contact(
        self,
        payload: MarketingContactCreate,
        *,
        client_ip: str | None,
    ) -> MarketingSubmissionResponse:
        await self._enforce_contact_rate_limits(payload.phone, client_ip)

        row = MarketingContactSubmission(
            name=payload.name,
            phone=payload.phone,
            email=str(payload.email) if payload.email else None,
            subject=payload.subject,
            message=payload.message,
            client_ip=client_ip,
        )
        saved = await self._repo.save_contact(row)
        log.info("marketing.contact_submitted", submission_id=str(saved.id))
        await self._notify_support_contact(saved)
        return MarketingSubmissionResponse(id=saved.id)

    async def submit_franchise_inquiry(
        self,
        payload: MarketingFranchiseInquiryCreate,
        *,
        client_ip: str | None,
    ) -> MarketingSubmissionResponse:
        if client_ip:
            since = datetime.now(UTC) - FRANCHISE_WINDOW
            ip_count = await self._repo.count_recent_franchise_by_ip(client_ip, since)
            if ip_count >= FRANCHISE_IP_LIMIT:
                raise RateLimitError("Too many franchise inquiries. Please try again later.")

        row = MarketingFranchiseInquiry(
            name=payload.name,
            phone=payload.phone,
            email=str(payload.email),
            city=payload.city,
            investment_range=payload.investment_range,
            message=payload.message,
            client_ip=client_ip,
        )
        saved = await self._repo.save_franchise_inquiry(row)
        log.info("marketing.franchise_inquiry_submitted", inquiry_id=str(saved.id))
        await self._notify_support_franchise(saved)
        return MarketingSubmissionResponse(id=saved.id)

    async def get_public_stats(self) -> MarketingPublicStatsResponse:
        stats_row = await self._repo.get_site_stats()
        now = datetime.now(UTC)

        happy_customers = await self._repo.count_customers()
        cities_covered = await self._repo.count_distinct_cities()
        pickup_points = await self._repo.count_approved_laundries()
        garments_cleaned = await self._repo.sum_garments_cleaned()
        avg_review_rating = await self._repo.avg_published_review_rating()

        happy_customers = stats_row.happy_customers_override or happy_customers
        cities_covered = stats_row.cities_covered_override or cities_covered
        pickup_points = stats_row.pickup_points_override or pickup_points
        garments_cleaned = stats_row.garments_cleaned_override or garments_cleaned
        if stats_row.avg_review_rating_override is not None:
            avg_review_rating = float(stats_row.avg_review_rating_override)
        await self._repo.touch_site_stats_aggregated_at(stats_row, now)

        satisfaction_percent = None
        if avg_review_rating is not None:
            satisfaction_percent = max(0, min(100, round((avg_review_rating / 5) * 100)))

        return MarketingPublicStatsResponse(
            happy_customers=happy_customers,
            cities_covered=cities_covered,
            pickup_points=pickup_points,
            garments_cleaned=garments_cleaned,
            avg_review_rating=round(avg_review_rating, 2) if avg_review_rating is not None else None,
            customer_satisfaction_percent=satisfaction_percent,
        )

    async def list_featured_testimonials(self, *, limit: int = 6) -> list[MarketingTestimonialResponse]:
        rows = await self._repo.list_featured_testimonials(limit=limit)
        return [MarketingTestimonialResponse.model_validate(row) for row in rows]

    async def _enforce_contact_rate_limits(self, phone: str, client_ip: str | None) -> None:
        since = datetime.now(UTC) - CONTACT_WINDOW
        phone_count = await self._repo.count_recent_contact_by_phone(phone, since)
        if phone_count >= CONTACT_PHONE_LIMIT:
            raise RateLimitError("Too many contact requests for this phone number. Please try again later.")

        if client_ip:
            ip_count = await self._repo.count_recent_contact_by_ip(client_ip, since)
            if ip_count >= CONTACT_IP_LIMIT:
                raise RateLimitError("Too many contact requests from this network. Please try again later.")

    async def _notify_support_contact(self, row: MarketingContactSubmission) -> None:
        subject = f"[WashHouse Contact] {row.subject.value}: {row.name}"
        text = (
            f"New contact form submission\n"
            f"---------------------------\n"
            f"ID: {row.id}\n"
            f"Name: {row.name}\n"
            f"Phone: {row.phone}\n"
            f"Email: {row.email or '(none)'}\n"
            f"Subject: {row.subject.value}\n"
            f"\n{row.message}\n"
        )
        await self._send_support_notification(
            event="marketing.contact_email",
            subject=subject,
            text=text,
            reply_to=row.email,
            entity_id=str(row.id),
        )

    async def _notify_support_franchise(self, row: MarketingFranchiseInquiry) -> None:
        subject = f"[WashHouse Franchise] {row.city}: {row.name}"
        text = (
            f"New franchise inquiry\n"
            f"---------------------\n"
            f"ID: {row.id}\n"
            f"Name: {row.name}\n"
            f"Phone: {row.phone}\n"
            f"Email: {row.email}\n"
            f"City: {row.city}\n"
            f"Investment: {row.investment_range.value}\n"
            f"\n{row.message}\n"
        )
        await self._send_support_notification(
            event="marketing.franchise_email",
            subject=subject,
            text=text,
            reply_to=row.email,
            entity_id=str(row.id),
        )

    async def _send_support_notification(
        self,
        *,
        event: str,
        subject: str,
        text: str,
        reply_to: str | None,
        entity_id: str,
    ) -> None:
        """Best-effort support email after DB persist. Never raises — lead stays saved."""
        try:
            await self._email.send(
                to=settings.support_inbox,
                subject=subject,
                text=text,
                reply_to=reply_to,
            )
            log.info(f"{event}.ok", entity_id=entity_id)
        except EmailNotConfiguredError:
            log.warning(
                f"{event}.skipped_not_configured",
                entity_id=entity_id,
                hint="Set SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM_EMAIL",
            )
        except EmailDeliveryError as exc:
            log.error(
                f"{event}.failed",
                entity_id=entity_id,
                error=exc.message,
            )
