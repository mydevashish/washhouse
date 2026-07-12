# Announcement Center

> Admin broadcast messaging for DLM — targeted, multi-channel, trackable  
> Last updated: 2026-06-03

## Overview

The Announcement Center lets admins send platform-wide or targeted messages without developer deployment. Supports **draft**, **schedule**, **publish**, and **archive** workflows with engagement tracking.

```
Admin  → /admin/announcements (compose, manage, analytics)
Users  → In-app banner via GET /announcements/active
API    → /api/v1/admin/announcements/*
         /api/v1/announcements/*
```

---

## Target audiences

| Target | Recipients |
|--------|------------|
| **All users** | Every active user |
| **Customers** | Users with role `customer` |
| **Partners** | Users with role `partner` or `partner_staff` |
| **Specific laundries** | Owners, staff, and customers who ordered at selected laundries |
| **Specific cities** | Partners in city + customers with address or order history in city |

Targeting is evaluated at display time for in-app banners and at publish time for email/push dispatch lists.

---

## Channels

| Channel | Behavior |
|---------|----------|
| **In-app** | Banner stack in customer, partner, and admin shells; also creates `notifications` rows on publish (cap 500) |
| **Email** | Logged dispatch stub; respects `notify_email_enabled` platform config |
| **Push** | Logged dispatch stub; respects `notify_push_enabled` platform config |

At least one channel must be enabled per announcement.

---

## Lifecycle

| Status | Description |
|--------|-------------|
| **Draft** | Saved, not visible to users |
| **Scheduled** | Will auto-publish when `scheduled_at` is reached |
| **Published** | Live for targeted users |
| **Archived** | Removed from active delivery |

### Admin actions

| Action | API | Effect |
|--------|-----|--------|
| Save draft | `POST /admin/announcements` | Creates draft (or scheduled if `scheduled_at` set) |
| Schedule | `POST /admin/announcements/{id}/schedule` | Sets future publish time |
| Publish | `POST /admin/announcements/{id}/publish` | Immediate publish + channel dispatch |
| Archive | `POST /admin/announcements/{id}/archive` | Stops delivery |

Scheduled announcements auto-publish when any user calls `GET /announcements/active` (lazy scheduler).

---

## Engagement tracking

| Metric | Event | Counting |
|--------|-------|----------|
| **Views** | `view` | Once per user (first banner display) |
| **Clicks** | `click` | Each CTA click |
| **Acknowledgements** | `acknowledge` | Once per user when required |

Counters denormalized on `announcements.view_count`, `click_count`, `acknowledgement_count`.

Events stored in `announcement_events` with partial unique index on view/ack per user.

User API:

```
POST /api/v1/announcements/{id}/events
{ "event_type": "view" | "click" | "acknowledge" }
```

Announcements with `requires_acknowledgement = true` stay visible until acknowledged.

---

## Admin API

Base: `/api/v1/admin/announcements`  
Auth: `admin`, `super_admin`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | List announcements (filter by status) |
| `GET` | `/{id}` | Get single announcement |
| `POST` | `/` | Create draft or scheduled announcement |
| `PATCH` | `/{id}` | Update draft/scheduled announcement |
| `POST` | `/{id}/publish` | Publish immediately |
| `POST` | `/{id}/schedule` | Schedule for future |
| `POST` | `/{id}/archive` | Archive |

---

## User API

Base: `/api/v1/announcements`  
Auth: any authenticated user

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/active` | Published in-app announcements for current user |
| `POST` | `/{id}/events` | Record view, click, or acknowledge |

---

## Database schema

### `announcements`

| Column | Purpose |
|--------|---------|
| `title`, `body` | Content |
| `status` | `draft`, `scheduled`, `published`, `archived` |
| `target_type` | Audience enum |
| `target_laundry_ids` | UUID array |
| `target_cities` | Text array |
| `channel_in_app`, `channel_email`, `channel_push` | Channel toggles |
| `action_url` | Optional CTA link |
| `requires_acknowledgement` | Must ack to dismiss |
| `scheduled_at`, `published_at`, `archived_at` | Lifecycle timestamps |
| `view_count`, `click_count`, `acknowledgement_count` | Engagement counters |

### `announcement_events`

Per-user engagement events (`view`, `click`, `acknowledge`).

### Audit actions

- `announcement_created`
- `announcement_updated`
- `announcement_scheduled`
- `announcement_published`
- `announcement_archived`

### Migration

```
backend/alembic/versions/20260603_0026_announcement_center.py
```

Apply:

```bash
cd backend && python -m alembic upgrade head
```

---

## Frontend

| Path | Component |
|------|-----------|
| `/admin/announcements` | `AdminAnnouncementCenterView` |
| In-app banner | `AnnouncementBannerStack` (all authenticated shells) |
| API client | `frontend/services/announcements.ts` |

Nav: **Monitoring → Announcement Center**

---

## File map

| Area | Path |
|------|------|
| Migration | `backend/alembic/versions/20260603_0026_announcement_center.py` |
| Model | `backend/app/models/announcement.py` |
| Repository | `backend/app/repositories/announcement.py` |
| Service | `backend/app/services/announcement_service.py` |
| Schemas | `backend/app/schemas/announcement.py` |
| Admin API | `backend/app/api/v1/endpoints/admin_announcements.py` |
| User API | `backend/app/api/v1/endpoints/announcements.py` |
| Admin UI | `frontend/features/admin/views/admin-announcement-center-view.tsx` |
| Banner | `frontend/components/announcements/announcement-banner.tsx` |
| Service | `frontend/services/announcements.ts` |

---

## Test plan

1. Log in as **admin** → open `/admin/announcements`.
2. Create **draft** targeting all users with in-app channel → not visible to users.
3. **Publish** draft → banner appears for logged-in customer/partner.
4. Click **Learn more** → click count increments.
5. Create announcement with **requires acknowledgement** → ack button dismisses banner.
6. **Schedule** announcement for future → status `scheduled`; auto-publishes after time when user loads app.
7. Target **specific cities** → only users in that city see banner.
8. Target **specific laundries** → only related partners/customers see banner.
9. **Archive** published announcement → banner disappears.
10. Verify view/click/ack counts on admin list.

---

## Related docs

- [PLATFORM_CONFIGURATION_CENTER.md](./PLATFORM_CONFIGURATION_CENTER.md) — notification channel toggles
- [CUSTOMER_INSIGHTS.md](./CUSTOMER_INSIGHTS.md) — partner customer targeting context
