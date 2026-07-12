"""Celery tasks for dispute SLA auto-escalation."""

from __future__ import annotations

import asyncio

from app.tasks.celery_app import celery_app


async def _run_auto_escalate() -> int:
    from app.db.session import AsyncSessionLocal
    from app.services.dispute_admin_service import DisputeAdminService

    async with AsyncSessionLocal() as session:
        count = await DisputeAdminService(session).auto_escalate_overdue()
        await session.commit()
        return count


@celery_app.task(name="disputes.auto_escalate_sla")
def auto_escalate_sla_overdue() -> int:
    return asyncio.run(_run_auto_escalate())
