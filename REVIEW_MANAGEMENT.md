# Review Management System

> Partner review engagement and admin moderation for DLM  
> Last updated: 2026-06-03

## Overview

Customers leave verified reviews after delivery. Partners manage feedback; admins moderate abuse and fake reviews. All actions are **audited**.

```
Customer → POST /laundries/{id}/reviews (delivered orders only)
Partner  → /partner/reviews (view, reply, filter, report abuse, analytics)
Admin    → /admin/reviews/moderation (hide, remove, mark fake, audit)
Public   → GET /laundries/{id}/reviews (published + partner replies)
```

---

## Partner features

| Feature | Description |
|---------|-------------|
| **View reviews** | List all reviews for partner laundry with customer name, rating, status |
| **Reply to reviews** | Public partner reply shown on discovery page |
| **Filter reviews** | By star rating, reply status, sentiment (positive/negative) |
| **Report abuse** | Flags review for admin moderation queue |

### Partner API

Base: `/api/v1/partner/review-management`  
Auth: `partner`, `partner_staff`, `admin`, `super_admin`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/reviews` | List reviews (filters: rating, min/max, has_reply, abuse_reported) |
| `GET` | `/analytics` | Average rating, trend, positive/negative counts, themes |
| `POST` | `/reviews/{id}/reply` | Post/update partner reply |
| `POST` | `/reviews/{id}/report-abuse` | Report abusive review |

---

## Analytics

Partner analytics at `GET /partner/review-management/analytics`:

| Metric | Calculation |
|--------|-------------|
| **Average rating** | Mean of published reviews |
| **Rating trend** | Daily avg rating over last 30 days |
| **Positive reviews** | Published reviews with rating ≥ 4 |
| **Negative reviews** | Published reviews with rating ≤ 2 |
| **Most common complaints** | Theme matching on 1–2★ review comments |
| **Most common praise** | Theme matching on 4–5★ review comments |

### Theme buckets

**Complaints:** Late delivery, Damaged items, Poor quality, Missing items, Rude service, Overpriced

**Praise:** Fast service, Great quality, Friendly staff, Good value, On-time delivery, Highly recommend

Themes use keyword matching on review comment text. Top 5 themes returned per category.

### Rating trend chart

30-day series: `{ date, avg_rating, review_count }` per day. Rendered as line chart on partner reviews page.

---

## Admin features

| Feature | Description |
|---------|-------------|
| **Remove fake reviews** | `mark_fake` — removes review, flags as fake |
| **Moderate reviews** | Hide, remove, restore |
| **Audit changes** | Full trail of replies, reports, moderation |

### Moderation actions

| Action | Effect |
|--------|--------|
| `hide` | Status → `hidden` (not public) |
| `remove` | Status → `removed` |
| `restore` | Status → `published`, clears abuse/fake flags |
| `mark_fake` | Status → `removed`, `is_fake = true` |

Laundry `avg_rating`, `review_count`, and trust score recalculate after moderation.

### Admin API

Base: `/api/v1/admin/review-management`  
Auth: `admin`, `super_admin`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/dashboard` | Moderation queue + abuse report counts |
| `GET` | `/reviews` | List all reviews (filters: status, abuse, fake, laundry) |
| `PATCH` | `/reviews/{id}/moderate` | Apply moderation action |
| `GET` | `/audit` | Review change audit log |

### Admin dashboard KPIs

| KPI | Source |
|-----|--------|
| **Moderation queue** | Reviews pending moderation or hidden with abuse flag |
| **Abuse reports** | Total reviews with `abuse_reported = true` |

---

## Review statuses

| Status | Visible to public | Partner view |
|--------|-------------------|--------------|
| `published` | Yes | Yes |
| `pending_moderation` | No | Yes |
| `hidden` | No | Yes |
| `removed` | No | Yes |

---

## Audit trail

All review management actions log to `audit_logs`:

| Action | Trigger |
|--------|---------|
| `review_reply` | Partner posts/updates reply |
| `review_abuse_report` | Partner reports abuse |
| `review_moderated` | Admin hides review |
| `review_removed` | Admin removes or marks fake |
| `review_restored` | Admin restores review |

Metadata includes `old_value`, `new_value`, `note`, `source: review_management`.  
`resource_type = review`, `resource_id = review UUID`.

---

## Database schema

### Extended `reviews`

| Column | Purpose |
|--------|---------|
| `status` | `review_status` enum |
| `partner_reply` | Partner public response |
| `partner_replied_at` | Reply timestamp |
| `partner_replied_by_user_id` | Actor |
| `abuse_reported` | Partner flagged |
| `abuse_reason` | Report reason |
| `abuse_reported_at` | Report timestamp |
| `abuse_reported_by_user_id` | Reporter |
| `is_fake` | Admin marked fake |
| `moderation_note` | Admin note |
| `moderated_by_user_id` | Admin actor |
| `moderated_at` | Moderation timestamp |

### Migration

```
backend/alembic/versions/20260603_0023_review_management.py
```

Apply:

```bash
cd backend && python -m alembic upgrade head
```

---

## Frontend

| Path | Role | Component |
|------|------|-----------|
| `/partner/reviews` | Partner | `PartnerReviewsView` |
| `/admin/reviews/moderation` | Admin | `AdminReviewManagementView` |
| `frontend/services/review-management.ts` | Both | API client + types |
| `frontend/features/partner/reviews/review-rating-trend-chart.tsx` | Partner | Rating trend chart |

Nav:
- Partner → **Reviews**
- Admin → **Reviews → Review moderation**

---

## File map

| Area | Path |
|------|------|
| Migration | `backend/alembic/versions/20260603_0023_review_management.py` |
| Model | `backend/app/models/review.py` |
| Repository | `backend/app/repositories/review_management.py` |
| Service | `backend/app/services/review_management_service.py` |
| Partner API | `backend/app/api/v1/endpoints/partner_review_management.py` |
| Admin API | `backend/app/api/v1/endpoints/admin_review_management.py` |
| Schemas | `backend/app/schemas/review_management.py` |
| Partner UI | `frontend/features/partner/views/partner-reviews-view.tsx` |
| Trend chart | `frontend/features/partner/reviews/review-rating-trend-chart.tsx` |
| Admin UI | `frontend/features/admin/views/admin-review-management-view.tsx` |
| API client | `frontend/services/review-management.ts` |

---

## Runtime integration

| Consumer | Behavior |
|----------|----------|
| `ReviewService` | Public list shows published reviews + partner replies |
| `ReviewManagementService` | Partner/admin management + audit |
| `LaundryTrustScoreService` | Recalculated after moderation |
| Discovery page | Shows avg rating from published reviews only |

---

## Test plan

1. Deliver order → customer submits review → appears on partner `/partner/reviews`.
2. Partner posts reply → visible on public laundry reviews tab.
3. Partner filters by 5★, "Needs reply", and "Negative (1–2★)".
4. Partner reports abuse → status `pending_moderation`, admin queue increments.
5. Admin hides review → removed from public list, laundry rating recalculates.
6. Admin marks fake → `is_fake=true`, audit log entry created.
7. Admin restores review → back to published.
8. Verify analytics: positive/negative counts, rating trend chart, complaint/praise themes.
9. Admin audit log shows reply, report, and moderation events.

---

## Related docs

- [docs/features/reviews.md](./docs/features/reviews.md) — original feature spec
- [BUSINESS_HEALTH_DASHBOARD.md](./BUSINESS_HEALTH_DASHBOARD.md) — platform KPIs
- [PLATFORM_CONFIGURATION_CENTER.md](./PLATFORM_CONFIGURATION_CENTER.md) — dispute windows
