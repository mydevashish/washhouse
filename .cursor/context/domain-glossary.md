# Domain Glossary

Speak the same language. Use these terms exactly, in code and docs.

| Term                  | Meaning                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| **Customer**          | End user who places laundry orders.                                                              |
| **Partner**           | Laundry business operator who fulfills orders.                                                   |
| **Admin**             | DLM employee with platform-wide privileges.                                                      |
| **Laundry**           | The business entity owned by a Partner. One Partner = one or more Laundries.                     |
| **Service**           | A specific offering at a Laundry (wash-fold, dry-clean, iron-only, etc.).                        |
| **Order**             | A booking: customer + laundry + services + pickup + delivery.                                    |
| **Pickup window**     | A time slot in which a partner agrees to collect the customer's laundry.                         |
| **Status**            | Lifecycle stage of an order: pending → confirmed → picked_up → washing → ready → out_for_delivery → delivered (or cancelled). |
| **Subscription**      | A monthly plan a customer buys; grants a kg / credit budget at a discount.                       |
| **Commission**        | The platform's percentage cut of a partner's order total. Default 15%.                           |
| **Payout**            | The weekly settlement DLM sends partners (gross − commission − adjustments).                     |
| **Refund**            | Returning money to a customer (full / partial). Reduces partner payout proportionally.           |
| **Rating**            | A customer's 1–5 score for a completed order; rolls into the laundry's average.                  |
| **Review**            | Optional text accompanying a rating.                                                             |
| **Complaint**         | Customer-raised dispute about an order; flows to admin queue.                                     |
| **Approval**          | The admin action that lets a newly registered Laundry start receiving orders.                    |
| **Surge**             | (Future) Time-window-based pricing multiplier.                                                   |
| **OTP**               | One-time password sent via SMS/email for verification.                                           |
| **MFA**               | (Future) Multi-factor authentication for admin/partner accounts.                                 |
| **Audit log**         | Immutable record of sensitive actions (admin, payments, role changes).                           |
| **Feature flag**      | Toggle that gates risky features per environment / user cohort.                                  |
| **Idempotency key**   | Client-provided UUID to make a non-idempotent POST safely retriable.                             |
| **Slug**              | URL-safe lowercase identifier (e.g., "quick-wash-bandra").                                       |

## Order status state machine

```
pending --(partner accepts)--> confirmed --(picked up)--> picked_up
                                              |
                                              v
                                          washing
                                              |
                                              v
                                            ready --(out for delivery)--> out_for_delivery
                                                                                |
                                                                                v
                                                                          delivered

Any status (before delivered) --(within window or by admin)--> cancelled
```

## Money

- All amounts at the **edges** are integer minor units (paise).
- At rest: `NUMERIC(12, 2)` with explicit currency code.
- Default currency: **INR**.
- Tax: GST applied per partner's tax registration.

## Time

- All timestamps are **UTC** in the DB and over the wire.
- Frontend converts to user's local TZ for display.
- Avoid IANA-zone math on the backend.
