# Template: Celery task
# Save as: backend/app/tasks/<domain>.py
from __future__ import annotations

import structlog

from app.tasks.celery_app import celery_app

log = structlog.get_logger(__name__)


@celery_app.task(
    bind=True,
    name="<domain>.<task_name>",
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=60,
    retry_jitter=True,
    max_retries=5,
    soft_time_limit=30,
    time_limit=60,
)
def <task_name>(self, *args, **kwargs) -> None:
    log.info("<domain>.<task_name>.start", args=args, kwargs=kwargs)
    try:
        # Re-load any required data inside the task — do not trust stale snapshots.
        # Perform the work here.
        ...
    except Exception as exc:
        log.warning(
            "<domain>.<task_name>.retry",
            attempt=self.request.retries,
            error=str(exc),
        )
        raise self.retry(exc=exc)
    log.info("<domain>.<task_name>.ok")
