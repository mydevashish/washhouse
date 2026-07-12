"""Detailed QA data counts."""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import text
from app.db.session import AsyncSessionLocal

QUERIES = [
    ("customers", "SELECT COUNT(*) FROM users WHERE role = 'customer' AND deleted_at IS NULL"),
    ("partners", "SELECT COUNT(*) FROM users WHERE role = 'partner' AND deleted_at IS NULL"),
    ("admins", "SELECT COUNT(*) FROM users WHERE role IN ('admin','super_admin') AND deleted_at IS NULL"),
    ("laundries", "SELECT COUNT(*) FROM laundries WHERE deleted_at IS NULL"),
    ("laundries_approved", "SELECT COUNT(*) FROM laundries WHERE status = 'approved' AND deleted_at IS NULL"),
    ("laundries_pending", "SELECT COUNT(*) FROM laundries WHERE status = 'pending_approval'"),
    ("laundries_suspended", "SELECT COUNT(*) FROM laundries WHERE status = 'suspended'"),
    ("orders", "SELECT COUNT(*) FROM orders WHERE deleted_at IS NULL"),
    ("reviews", "SELECT COUNT(*) FROM reviews"),
    ("disputes", "SELECT COUNT(*) FROM complaints"),
    ("refunded_orders", "SELECT COUNT(*) FROM orders WHERE payment_status = 'refunded'"),
    ("failed_payments", "SELECT COUNT(*) FROM orders WHERE payment_status = 'failed'"),
    ("trust_events", "SELECT COUNT(*) FROM customer_trust_score_events"),
    ("fraud_alerts", "SELECT COUNT(*) FROM fraud_alerts"),
    ("audit_logs", "SELECT COUNT(*) FROM audit_logs"),
    ("notifications", "SELECT COUNT(*) FROM notifications"),
    ("vip_users", "SELECT COUNT(*) FROM users WHERE email = 'vip@demo.dlm'"),
    ("high_risk_users", "SELECT COUNT(*) FROM users WHERE fraud_risk_level = 'critical'"),
]

async def main():
    async with AsyncSessionLocal() as s:
        print("=== Entity Counts ===")
        for label, q in QUERIES:
            r = await s.execute(text(q))
            print(f"{label}: {r.scalar_one()}")

        print("\n=== Orders by Status ===")
        r = await s.execute(text(
            "SELECT status::text, COUNT(*) FROM orders GROUP BY status ORDER BY COUNT(*) DESC"
        ))
        for row in r.all():
            print(f"  {row[0]}: {row[1]}")

        print("\n=== Payments by Status ===")
        r = await s.execute(text(
            "SELECT payment_status::text, COUNT(*) FROM orders GROUP BY payment_status ORDER BY COUNT(*) DESC"
        ))
        for row in r.all():
            print(f"  {row[0]}: {row[1]}")

        print("\n=== Disputes by Status ===")
        r = await s.execute(text(
            "SELECT status::text, COUNT(*) FROM complaints GROUP BY status"
        ))
        for row in r.all():
            print(f"  {row[0]}: {row[1]}")

        print("\n=== Trust Scores (sample) ===")
        r = await s.execute(text(
            "SELECT email, trust_score, fraud_risk_level::text FROM users WHERE email LIKE '%@demo.dlm' ORDER BY email LIMIT 10"
        ))
        for row in r.all():
            print(f"  {row[0]}: trust={row[1]} fraud={row[2]}")

asyncio.run(main())
