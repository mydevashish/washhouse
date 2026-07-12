# Commission Model

DLM keeps a percentage of partner order revenue.

## Defaults

- **15%** of order total
- Configurable per partner (`commission_rate` column on `laundries`)
- Effective rate stored on each order at creation time (so future rate changes don't retroactively apply)

## Payouts

- **Weekly**, every Monday at 04:00 UTC
- Batch: all orders **delivered** in the prior Mon–Sun window
- Net payout = gross − commission − refund adjustments − adjustments
- Settled via UPI / bank transfer (provider TBD via ADR)
- Each payout writes an `audit_logs` entry + `payouts` row

## Refunds

- Customer refund **reduces partner gross proportionally**
- Refund amount × (1 − commission_rate) recouped from the partner
- Audited

## Adjustments

- Manual adjustments (penalties, bonuses) live in `commission_adjustments`
- Require admin approval
- Audited

## Transparency

- Partner dashboard shows: gross, commission, deductions, net for the current cycle
- Statement PDF generated weekly

## Disputes

- Partner can flag a payout within 7 days
- Admin reviews; resolution audited
