# Infrastructure

Provider configs + IaC.

| Path                | Purpose                                                |
| ------------------- | ------------------------------------------------------ |
| `vercel/`           | Vercel project + headers + redirects                   |
| `railway/`          | Railway services + env mapping                         |
| `neon/`             | Neon project / branch policy notes                     |
| `upstash/`          | Upstash Redis policy                                   |
| `sentry/`           | Sentry projects + alert rules                          |
| `terraform/`        | (future) any IaC we adopt                              |

## Principles

- **Reproducible.** Every prod resource is described here.
- **Reviewable.** Infra changes go through PR.
- **Documented.** README in each subfolder explains what / why.
- **Secrets out.** Never commit secrets. Use provider dashboards + GitHub Secrets.

See `docs/deployment/*` for env-by-env runbooks.
