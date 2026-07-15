"""Quick CRUD smoke for fix-api-crud-by-role prompt."""

from __future__ import annotations

import asyncio
import sys

import httpx

BASE = "http://127.0.0.1:8000/api/v1"

CREDS = {
    "customer": ("customer@demo.dlm", "Customer@1234"),
    "partner": ("partner.koramangala@demo.dlm", "Partner@1234"),
    "admin": ("admin@yopmail.com", "Admin@1234"),
}


async def login(client: httpx.AsyncClient, email: str, password: str) -> str:
    r = await client.post(f"{BASE}/auth/login", json={"email": email, "password": password})
    r.raise_for_status()
    return r.json()["data"]["tokens"]["access_token"]


async def main() -> int:
    failures: list[str] = []
    async with httpx.AsyncClient(timeout=30) as client:
        tokens = {}
        for role, (email, pw) in CREDS.items():
            try:
                tokens[role] = await login(client, email, pw)
                print(f"OK login {role}")
            except Exception as exc:
                failures.append(f"login {role}: {exc}")

        ct = tokens.get("customer")
        if ct:
            h = {"Authorization": f"Bearer {ct}"}
            for method, path in [
                ("GET", "/laundries"),
                ("GET", "/orders"),
                ("GET", "/users/me"),
                ("GET", "/users/me/addresses"),
            ]:
                r = await client.request(method, f"{BASE}{path}", headers=h)
                print(f"{'OK' if r.status_code == 200 else 'FAIL'} customer {method} {path} -> {r.status_code}")
                if r.status_code != 200:
                    failures.append(f"customer {path} -> {r.status_code}")
            r = await client.patch(f"{BASE}/users/me", headers=h, json={"full_name": "Customer Demo"})
            print(f"{'OK' if r.status_code == 200 else 'FAIL'} customer PATCH /users/me -> {r.status_code}")
            r = await client.post(
                f"{BASE}/users/me/addresses",
                headers=h,
                json={
                    "label": "CRUD Test",
                    "line1": "123 Test St",
                    "city": "Bengaluru",
                    "state": "KA",
                    "pincode": "560001",
                    "is_default": False,
                },
            )
            print(f"{'OK' if r.status_code in (200, 201) else 'FAIL'} customer POST address -> {r.status_code}")
            if r.status_code in (200, 201):
                aid = r.json()["data"]["id"]
                dr = await client.delete(f"{BASE}/users/me/addresses/{aid}", headers=h)
                print(f"{'OK' if dr.status_code == 200 else 'FAIL'} customer DELETE address -> {dr.status_code}")

        pt = tokens.get("partner")
        if pt:
            h = {"Authorization": f"Bearer {pt}"}
            for path in [
                "/partner/analytics/summary",
                "/partner/orders",
                "/partner/operations/dashboard",
                "/partner/services",
                "/partner/staff-management/dashboard",
                "/partner/staff-management",
                "/partner/staff-management/activity",
                "/partner/settlements",
            ]:
                r = await client.get(f"{BASE}{path}", headers=h)
                print(f"{'OK' if r.status_code == 200 else 'FAIL'} partner GET {path} -> {r.status_code}")
                if r.status_code != 200:
                    failures.append(f"partner {path} -> {r.status_code}")

        at = tokens.get("admin")
        if at:
            h = {"Authorization": f"Bearer {at}"}
            for path, params in [
                ("/admin/dashboard", None),
                ("/admin/laundries", None),
                ("/admin/laundries/pending", None),
                ("/admin/orders", {"page": 1, "page_size": 10}),
                ("/admin/users", {"page": 1, "page_size": 10}),
            ]:
                r = await client.get(f"{BASE}{path}", headers=h, params=params)
                print(f"{'OK' if r.status_code == 200 else 'FAIL'} admin GET {path} -> {r.status_code}")
                if r.status_code != 200:
                    failures.append(f"admin {path} -> {r.status_code}")

    print(f"\nTotal failures: {len(failures)}")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
