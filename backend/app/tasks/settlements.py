"""Celery tasks for settlement eligibility and batch creation."""

from __future__ import annotations

import asyncio

from app.tasks.celery_app import celery_app


async def _run_settlement_pipeline() -> dict:
    from app.db.session import AsyncSessionLocal
    from app.services.settlement_service import SettlementService

    async with AsyncSessionLocal() as session:
        svc = SettlementService(session)
        eligibility = await svc.scan_eligibility()
        created = await svc.create_settlements_from_eligible()
        await session.commit()
        return {"eligibility_updated": eligibility, "settlements_created": created}


@celery_app.task(name="settlements.process_eligible")
def process_eligible_settlements() -> dict:
    return asyncio.run(_run_settlement_pipeline())
