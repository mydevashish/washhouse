"""Celery application configuration."""

from __future__ import annotations

from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "dlm",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.tasks.dispute_sla",
        "app.tasks.order_notifications",
        "app.tasks.settlements",
    ],
)

celery_app.conf.update(
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    task_track_started=True,
    task_default_retry_delay=10,
    task_max_retries=5,
    worker_max_tasks_per_child=200,
    timezone="UTC",
    enable_utc=True,
    # Fail fast when Redis broker is down so API request paths never hang.
    broker_connection_timeout=2,
    broker_connection_retry_on_startup=False,
    broker_connection_max_retries=1,
    broker_transport_options={
        "socket_connect_timeout": 2,
        "socket_timeout": 2,
        "retry_on_timeout": False,
        "max_connections": 10,
    },
    result_backend_transport_options={
        "socket_connect_timeout": 2,
        "socket_timeout": 2,
        "retry_on_timeout": False,
    },
)

# Beat schedule
celery_app.conf.beat_schedule = {
    "disputes-auto-escalate-sla": {
        "task": "disputes.auto_escalate_sla",
        "schedule": 300.0,
    },
    "settlements-process-eligible": {
        "task": "settlements.process_eligible",
        "schedule": 3600.0,
    },
}
