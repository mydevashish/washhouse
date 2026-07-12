# Docker

Service-specific Dockerfiles live next to the code they containerize:

- `backend/Dockerfile`
- `frontend/Dockerfile`

This folder holds **shared / orchestration** assets:

| File                            | Purpose                                                     |
| ------------------------------- | ----------------------------------------------------------- |
| `docker-compose.override.yml`   | Local dev overrides (mounts, hot reload, debug ports)       |
| `docker-compose.prod.yml`       | Compose file for self-hosted prod (rarely used; provider hosts prod) |
| `postgres/init.sql`             | Initial Postgres extensions for local dev                   |
| `nginx/`                        | (optional) Reverse proxy config for self-hosted prod        |

## Usage

```bash
# Local dev (auto-uses override)
docker compose up

# Self-hosted prod simulation
docker compose -f docker-compose.yml -f docker/docker-compose.prod.yml up -d
```
