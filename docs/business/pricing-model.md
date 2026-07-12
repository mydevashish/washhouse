# Pricing Model

## Order pricing

`total = sum(line_items) + delivery_fee + tax − discount`

- **Line items** — per-service rate × quantity / weight, per partner's price list
- **Delivery fee** — partner-defined, free above a threshold (configurable)
- **Tax (GST)** — applied per partner's registration; displayed as a breakdown
- **Discount** — promo codes, subscription savings, referrals

## Money representation

- API edge: integer minor units (paise)
- DB: `NUMERIC(12, 2)` with explicit `currency`
- Rounding: half-even (banker's). Round once at the boundary.

## Examples

| Subtotal | Delivery | Tax (18%) | Discount | Total   |
| -------- | -------- | --------- | -------- | ------- |
| ₹200.00  | ₹40.00   | ₹43.20    | ₹0       | ₹283.20 |
| ₹500.00  | ₹0.00    | ₹90.00    | ₹50.00   | ₹540.00 |

## Edge cases

- Minimum order amount enforced per partner
- Tax-exempt items handled as zero-rated lines
- Currency mismatch (multi-currency future) — rejected at validation
