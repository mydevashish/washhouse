# Demo Accounts — DLM QA Testing

**Password convention:** All `@demo.dlm` QA accounts use documented passwords below.  
**Environment:** Local dev after running `python backend/scripts/seed_qa.py`

---

## Primary test accounts (use these first)

### Admin

| Field | Value |
| ----- | ----- |
| Email | admin@demo.dlm |
| Password | Admin@1234 |
| Role | admin |
| Notes | Created by QA seed; full admin access |

**Alternate admin (auto startup seed):**

| Field | Value |
| ----- | ----- |
| Email | admin@yopmail.com |
| Password | Admin@1234 |
| Role | admin |

---

### Partner (primary)

| Field | Value |
| ----- | ----- |
| Email | partner.koramangala@demo.dlm |
| Password | Partner@1234 |
| Role | partner |
| Laundry | Quick Wash Koramangala (+ Branch 2 multi-location) |
| Notes | Has storefront seed data |

**Other demo partners:**

| Email | Password | Laundry |
| ----- | -------- | ------- |
| partner.indiranagar@demo.dlm | Partner@1234 | Sparkle Clean Indiranagar |
| partner.hsr@demo.dlm | Partner@1234 | FreshFold HSR Layout |
| partner1.aarav@demo.dlm | Demo@1234 | QA laundry (generated) |
| partner{N}.{name}@demo.dlm | Demo@1234 | QA laundries 4–20 |

---

### Customer (standard)

| Field | Value |
| ----- | ----- |
| Email | customer@demo.dlm |
| Password | Customer@1234 |
| Role | customer |
| Trust score | 100 |
| Address | Koramangala (pre-seeded) |
| Notes | Has orders after QA seed |

**Bulk QA customers:** `customer1.aarav@demo.dlm` … `customer100.meera@demo.dlm` — Password: `Demo@1234`

---

### VIP customer

| Field | Value |
| ----- | ----- |
| Email | vip@demo.dlm |
| Password | Customer@1234 |
| Trust score | 92 |
| Fraud risk | low |
| Use for | Gold trust tier, low-risk checkout testing |

---

### High risk customer

| Field | Value |
| ----- | ----- |
| Email | highrisk@demo.dlm |
| Password | Customer@1234 |
| Trust score | 38 |
| Fraud risk | critical |
| Use for | Admin trust scores, fraud alerts (dispute spike) |

---

### Blocked customer (simulated)

| Field | Value |
| ----- | ----- |
| Email | blocked@demo.dlm |
| Password | Customer@1234 |
| Trust score | 0 |
| Fraud risk | critical |
| Use for | High-risk / chargeback / refund abuse scenarios |

> Note: No `is_blocked` column — "blocked" is simulated via trust score 0 + critical fraud risk.

---

## Scenario quick picks

| Scenario | Login as |
| -------- | -------- |
| Browse without login | — (public `/discover`) |
| Place new order | customer@demo.dlm |
| Partner manage orders | partner.koramangala@demo.dlm |
| Admin review dispute | admin@demo.dlm |
| View fraud alerts | admin@demo.dlm |
| Trust score review | admin@demo.dlm → search highrisk / vip |
| Inactive laundry | admin@demo.dlm → Laundries → find suspended |
| Multi-branch partner | partner.koramangala@demo.dlm (2 laundries) |
| Phone OTP login | Any phone; use OTP from API response in dev (`otp_debug`) |

---

## Phone OTP (dev)

On `/login` → Phone OTP tab:
- Enter phone e.g. `+919876543210`
- In dev, OTP appears in toast/API as `otp_debug`

---

## Registration (new user)

| Field | Example |
| ----- | ------- |
| URL | `/register` |
| Email | your.name+test@example.com |
| Password | Min requirements per form |

Creates a new customer with trust score 100 (default).

---

## Security reminder

These credentials are for **local QA only**. Never use in production.  
Change `JWT_SECRET`, admin passwords, and disable `otp_debug` before any public deployment.
