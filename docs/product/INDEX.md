# DLM Product Index

Canonical product reference for the Doorstep Laundry Marketplace. Execution specs live in [`docs/features/`](../features/); historical brainstorms are archived at the bottom.

## Vision

Youth-focused, mobile-first **doorstep laundry marketplace** (not "laundry management software"). Customers discover nearby laundries, book pickup/delivery, track orders, pay (UPI/COD), and subscribe. Partners run operations; admins govern the network.

## Stack (v1 production)

| Layer | Choice |
| ----- | ------ |
| Frontend | Next.js 15 App Router, TypeScript, Tailwind, shadcn/ui, TanStack Query, Zustand |
| Backend | FastAPI async, SQLAlchemy 2, Alembic, Celery, Redis |
| Database | PostgreSQL 16 (Neon) |
| Payments | Razorpay + COD ([ADR-001](../decisions/ADR-001-payment-provider.md)) |
| Subscriptions | Razorpay subscriptions or Celery renewal ([ADR-002](../decisions/ADR-002-subscription-billing.md)) |
| Hosting | Vercel (FE), Railway (BE), Upstash (Redis) |
| Media | Cloudinary / S3 |
| Email | Resend |
| OTP / SMS / WhatsApp | Twilio or MessageBird (templates) |

**Not v1:** React Native apps, PostGIS (use haversine until >10k laundries), Razorpay Route auto-payouts.

## India launch constraints

- UPI, cards, wallets via Razorpay; COD with partner confirmation
- GST on orders: `gst_rate`, `cgst`, `sgst`, `invoice_number`
- Phone OTP + optional WhatsApp templates
- Default platform commission: **10%** (per-partner override in admin)
- Hindi/local language: post-MVP i18n

## Roadmap phases

| Phase | Focus | Doc |
| ----- | ----- | --- |
| 0 | Doc consolidation | This index + [traceability.md](traceability.md) |
| 1 | Auth, profile, UI shell, CI/Sentry | [roadmap](../roadmap/README.md) |
| 2 | Customer discover, book, track, review | |
| 3 | Partner panel, inventory, QR, staff | |
| 4 | Admin approvals, commission, complaints | |
| 5 | Payments, subscriptions, notifications | |
| 6 | Loyalty, landing, production hardening | |

## Feature specs

See [features/README.md](../features/README.md).

## Deferred (v2+)

- AI price recommendation
- Smart route optimization
- Multi-city franchise management
- Native iOS/Android (PWA first)
- Automated partner payouts (Razorpay Route)

## Source documents (historical)

| File | Role |
| ---- | ---- |
| [DISCUSSION.md](../DISCUSSION.md) | Early stack, timeline, MVP lists |
| [Doorstep laundry marketplace.md](../Doorstep%20laundry%20marketplace.md) | User flows, partner/admin detail |

Use [traceability.md](traceability.md) to map sections → phase → feature spec.
