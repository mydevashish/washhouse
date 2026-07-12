"""Print row counts for QA audit."""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import text
from app.db.session import AsyncSessionLocal

async def main():
    async with AsyncSessionLocal() as s:
        for q, label in [
            ("SELECT role::text, COUNT(*) FROM users WHERE deleted_at IS NULL GROUP BY role", "users"),
            ("SELECT status::text, COUNT(*) FROM orders GROUP BY status", "orders"),
            ("SELECT payment_status::text, COUNT(*) FROM orders GROUP BY payment_status", "payments"),
            ("SELECT status::text, COUNT(*) FROM complaints GROUP BY status", "complaints"),
        ]:
            try:
                r = await s.execute(text(q))
                print(label, dict(r.all()))
            except Exception as e:
                print(label, "ERR", e)

asyncio.run(main())
