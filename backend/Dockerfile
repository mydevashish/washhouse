# =============================================================================
# DLM Backend — multi-stage Dockerfile
# Targets:
#   - base   : Python + system deps
#   - deps   : install Python deps
#   - dev    : dev tooling, hot-reload
#   - prod   : slim runtime
# =============================================================================

ARG PYTHON_VERSION=3.12-slim-bookworm

# -----------------------------------------------------------------------------
# Base
# -----------------------------------------------------------------------------
FROM python:${PYTHON_VERSION} AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libpq5 \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# -----------------------------------------------------------------------------
# Deps (cached layer)
# -----------------------------------------------------------------------------
FROM base AS deps
COPY requirements/ ./requirements/
RUN pip install --upgrade pip

# -----------------------------------------------------------------------------
# Dev
# -----------------------------------------------------------------------------
FROM deps AS dev
RUN pip install -r requirements/dev.txt
COPY . .
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --retries=5 \
  CMD curl -fsS http://localhost:8000/api/v1/health || exit 1
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# -----------------------------------------------------------------------------
# Prod
# -----------------------------------------------------------------------------
FROM deps AS prod
RUN pip install -r requirements/prod.txt
COPY . .

# Non-root user
RUN useradd -m -u 1001 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --retries=5 \
  CMD curl -fsS http://localhost:8000/api/v1/health || exit 1

CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
