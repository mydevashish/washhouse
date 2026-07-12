"""Laundry full-text search: tags, tsvector, GIN indexes, triggers.

Revision ID: 20260602_0004
Revises: 20260602_0003
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect, text
from sqlalchemy.dialects import postgresql

revision = "20260602_0004"
down_revision = "20260602_0003"
branch_labels = None
depends_on = None

_EMPTY = "E''"


def _has_column(table: str, column: str) -> bool:
    bind = op.get_bind()
    return column in {c["name"] for c in inspect(bind).get_columns(table)}


def upgrade() -> None:
    op.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))

    if not _has_column("laundries", "tags"):
        op.add_column(
            "laundries",
            sa.Column("tags", postgresql.ARRAY(sa.Text()), nullable=False, server_default="{}"),
        )
    if not _has_column("laundries", "search_vector"):
        op.add_column("laundries", sa.Column("search_vector", postgresql.TSVECTOR(), nullable=True))

    op.execute(
        text(
            f"""
            CREATE OR REPLACE FUNCTION dlm_build_laundry_search_vector(p_laundry_id UUID)
            RETURNS tsvector
            LANGUAGE plpgsql
            STABLE
            AS $dlm$
            DECLARE
                r RECORD;
                svc_text TEXT;
                tag_text TEXT;
                empty TEXT := {_EMPTY};
            BEGIN
                SELECT name, description, address_line, city, tags
                INTO r
                FROM laundries
                WHERE id = p_laundry_id;

                IF NOT FOUND THEN
                    RETURN to_tsvector('simple', empty);
                END IF;

                SELECT string_agg(trim(s.name) || ' ' || trim(s.category), ' ')
                INTO svc_text
                FROM laundry_services s
                WHERE s.laundry_id = p_laundry_id
                  AND s.deleted_at IS NULL
                  AND s.is_active = TRUE;

                tag_text := coalesce(array_to_string(r.tags, ' '), empty);

                RETURN
                    setweight(to_tsvector('english', coalesce(r.name, empty)), 'A')
                    || setweight(to_tsvector('english', coalesce(r.description, empty)), 'B')
                    || setweight(to_tsvector('english', coalesce(tag_text, empty)), 'B')
                    || setweight(to_tsvector('english', coalesce(svc_text, empty)), 'B')
                    || setweight(
                        to_tsvector(
                            'simple',
                            coalesce(r.address_line, empty) || ' ' || coalesce(r.city, empty)
                        ),
                        'C'
                    );
            END;
            $dlm$;
            """
        )
    )

    op.execute(
        text(
            f"""
            CREATE OR REPLACE FUNCTION dlm_laundry_search_vector_trigger()
            RETURNS trigger
            LANGUAGE plpgsql
            AS $dlm$
            DECLARE
                empty TEXT := {_EMPTY};
            BEGIN
                IF TG_OP = 'INSERT' THEN
                    NEW.search_vector :=
                        setweight(to_tsvector('english', coalesce(NEW.name, empty)), 'A')
                        || setweight(to_tsvector('english', coalesce(NEW.description, empty)), 'B')
                        || setweight(
                            to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), empty)),
                            'B'
                        )
                        || setweight(
                            to_tsvector(
                                'simple',
                                coalesce(NEW.address_line, empty) || ' ' || coalesce(NEW.city, empty)
                            ),
                            'C'
                        );
                ELSE
                    NEW.search_vector := dlm_build_laundry_search_vector(NEW.id);
                END IF;
                RETURN NEW;
            END;
            $dlm$;
            """
        )
    )

    op.execute(
        text(
            """
            CREATE OR REPLACE FUNCTION dlm_laundry_service_search_refresh()
            RETURNS trigger
            LANGUAGE plpgsql
            AS $dlm$
            DECLARE
                lid UUID;
            BEGIN
                lid := COALESCE(NEW.laundry_id, OLD.laundry_id);
                UPDATE laundries
                SET search_vector = dlm_build_laundry_search_vector(lid),
                    updated_at = now()
                WHERE id = lid;
                RETURN COALESCE(NEW, OLD);
            END;
            $dlm$;
            """
        )
    )

    op.execute(text("DROP TRIGGER IF EXISTS trg_laundries_search_vector ON laundries"))
    op.execute(
        text(
            """
            CREATE TRIGGER trg_laundries_search_vector
            BEFORE INSERT OR UPDATE OF name, description, address_line, city, tags
            ON laundries
            FOR EACH ROW
            EXECUTE FUNCTION dlm_laundry_search_vector_trigger();
            """
        )
    )

    op.execute(text("DROP TRIGGER IF EXISTS trg_laundry_services_search_refresh ON laundry_services"))
    op.execute(
        text(
            """
            CREATE TRIGGER trg_laundry_services_search_refresh
            AFTER INSERT OR UPDATE OR DELETE ON laundry_services
            FOR EACH ROW
            EXECUTE FUNCTION dlm_laundry_service_search_refresh();
            """
        )
    )

    op.execute(
        text(
            """
            UPDATE laundries l
            SET tags = CASE l.slug
                WHEN 'demo-quick-wash-koramangala'
                    THEN ARRAY['wash','fold','koramangala','same-day','eco-friendly']
                WHEN 'demo-sparkle-indiranagar'
                    THEN ARRAY['premium','dry-clean','indiranagar','formals']
                WHEN 'demo-freshfold-hsr'
                    THEN ARRAY['budget','hsr','students','family']
                ELSE ARRAY[]::text[]
            END
            WHERE l.slug LIKE 'demo-%';
            """
        )
    )

    op.execute(
        text(
            """
            UPDATE laundries
            SET search_vector = dlm_build_laundry_search_vector(id)
            WHERE deleted_at IS NULL;
            """
        )
    )

    op.execute(
        text(
            """
            CREATE INDEX IF NOT EXISTS ix_laundries_search_vector_gin
            ON laundries USING GIN (search_vector);
            """
        )
    )
    op.execute(
        text(
            """
            CREATE INDEX IF NOT EXISTS ix_laundries_name_trgm
            ON laundries USING GIN (name gin_trgm_ops);
            """
        )
    )
    op.execute(
        text(
            """
            CREATE INDEX IF NOT EXISTS ix_laundries_tags_gin
            ON laundries USING GIN (tags);
            """
        )
    )


def downgrade() -> None:
    op.execute(text("DROP INDEX IF EXISTS ix_laundries_tags_gin"))
    op.execute(text("DROP INDEX IF EXISTS ix_laundries_name_trgm"))
    op.execute(text("DROP INDEX IF EXISTS ix_laundries_search_vector_gin"))
    op.execute(text("DROP TRIGGER IF EXISTS trg_laundry_services_search_refresh ON laundry_services"))
    op.execute(text("DROP TRIGGER IF EXISTS trg_laundries_search_vector ON laundries"))
    op.execute(text("DROP FUNCTION IF EXISTS dlm_laundry_service_search_refresh()"))
    op.execute(text("DROP FUNCTION IF EXISTS dlm_laundry_search_vector_trigger()"))
    op.execute(text("DROP FUNCTION IF EXISTS dlm_build_laundry_search_vector(UUID)"))
    if _has_column("laundries", "search_vector"):
        op.drop_column("laundries", "search_vector")
    if _has_column("laundries", "tags"):
        op.drop_column("laundries", "tags")
