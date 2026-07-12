# Seed Data Report — DLM Platform

**Generated:** 2026-06-03  
**Script:** `backend/scripts/seed_qa.py`  
**Marker:** `platform_settings.qa_seed_version = 1`

---

## Execution summary

| Step | Result |
| ---- | ------ |
| Command | `python backend/scripts/seed_qa.py` |
| Duration | ~44 seconds |
| Idempotent | Yes — skips if marker exists |
| Force reset | `python scripts/seed_qa.py --force` (clears marker only) |

---

## Records created (this run)

| Entity | Created |
| ------ | ------- |
| Orders | 2000 |
| Reviews | 50 |
| Disputes | 20 |
| Refunded orders | 30 |
| Trust score events | 5 |
| Fraud alerts | 3 |
| Audit logs | 100 |
| Notifications | 150 |
| Additional users | ~117 (to reach 100 customers + 20 partners) |
| Additional laundries | ~13 (to reach 15 + 1 branch) |

---

## Special accounts created/updated

| Email | Role | Trust | Fraud risk |
| ----- | ---- | ----- | ---------- |
| admin@demo.dlm | admin | — | low |
| vip@demo.dlm | customer | 92 | low |
| highrisk@demo.dlm | customer | 38 | critical |
| blocked@demo.dlm | customer | 0 | critical |

Existing preserved: `customer@demo.dlm`, `partner.*@demo.dlm`, `admin@yopmail.com`

---

## Data distribution

### Orders (2000 total)

- **Delivered:** 1152 (57.6%)
- **In progress (confirmed → out_for_delivery):** 752
- **Cancelled:** 96

### Payments

- Paid: 1369
- Pending: 289
- Pending COD: 264
- Failed: 48
- Refunded: 30

### Laundries (16 total)

- Approved: 14
- Pending approval: 1 (inactive scenario)
- Suspended: 1 (inactive scenario)
- Multi-branch: Quick Wash Koramangala + Branch 2

### Disputes (20)

- Distributed across open, investigating, resolved, rejected, escalated

---

## Realistic data characteristics

- **Indian names:** Aarav, Priya, Sharma, Patel, etc.
- **Cities:** Bengaluru, Mumbai, Hyderabad with pincodes
- **Emails:** `{role}{n}.{firstname}@demo.dlm`
- **Tracking codes:** `QA` + hex (unique)
- **Order dates:** Random within last 90 days
- **Relationships:** Orders link valid customer → address → laundry → service

---

## What seed does NOT create

See `MISSING_TEST_DATA.md`:

- Binary evidence (pickup/delivery photos)
- Inventory verification rows
- Custody timeline events
- Complaint photo attachments
- Live payment Razorpay IDs

---

## Verification commands

```bash
cd backend
python scripts/qa_counts.py      # Full breakdown
python scripts/count_db.py       # Simple table counts
```

---

## Startup seed vs QA seed

| Script | When | Volume |
| ------ | ---- | ------ |
| Auto startup | Every backend boot | 1 admin + 3 laundries + 1 customer |
| `seed.py` | Manual | Same as startup |
| `seed_qa.py` | Manual QA setup | Full dataset |

**Recommendation:** Run migrations → start backend once → run `seed_qa.py` for QA team.

---

## Rollback

QA seed does not auto-delete. To remove:

1. Drop and recreate database, OR
2. Manual SQL truncate (respect FK order), OR
3. Delete `platform_settings` row `qa_seed_version` and truncate tables (advanced)

Fresh start:

```bash
docker compose down -v   # if using docker postgres
alembic upgrade head
python scripts/seed.py
python scripts/seed_qa.py
```
