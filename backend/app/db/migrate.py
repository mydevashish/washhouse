"""Run pending Alembic migrations on application startup."""

from __future__ import annotations

from pathlib import Path

import structlog
from alembic import command
from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import create_engine, pool

from app.core.config import alembic_sqlalchemy_url_option, settings

log = structlog.get_logger(__name__)

_BACKEND_ROOT = Path(__file__).resolve().parents[2]


def _alembic_config() -> Config:
    ini_path = _BACKEND_ROOT / "alembic.ini"
    cfg = Config(str(ini_path))
    cfg.set_main_option("script_location", str(_BACKEND_ROOT / "alembic"))
    cfg.set_main_option("sqlalchemy.url", alembic_sqlalchemy_url_option())
    return cfg


def run_pending_migrations() -> None:
    """Apply all pending migrations up to head (no-op if already current)."""
    cfg = _alembic_config()
    script = ScriptDirectory.from_config(cfg)
    head = script.get_current_head()

    if head is None:
        log.warning("db.migrations.no_revisions")
        return

    engine = create_engine(settings.DATABASE_URL_DIRECT, poolclass=pool.NullPool)
    try:
        with engine.connect() as connection:
            context = MigrationContext.configure(connection)
            current = context.get_current_revision()

        if current == head:
            log.info("db.migrations.up_to_date", revision=current)
            return

        log.info("db.migrations.pending", current=current or "(none)", target=head)
        command.upgrade(cfg, "head")

        with engine.connect() as connection:
            context = MigrationContext.configure(connection)
            new_revision = context.get_current_revision()

        log.info("db.migrations.applied", revision=new_revision)
    finally:
        engine.dispose()
