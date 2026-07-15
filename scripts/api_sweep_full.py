"""Comprehensive API sweep for diagnose-api-errors — all role surfaces."""
from __future__ import annotations

import json
import urllib.error
import urllib.request
from dataclasses import dataclass

BASE = "http://localhost:8000/api/v1"


@dataclass
class Row:
    page: str
    role: str
    method: str
    endpoint: str
    status: int | None
    error_code: str | None
    error_message: str | None

    @property
    def failed(self) -> bool:
        return self.status is None or self.status >= 400

    def category(self) -> str:
        if self.status is None:
            return "A"
        if self.status == 401:
            return "C"
        if self.status == 403:
            return "D"
        if self.status == 404:
            return "E"
        if self.status == 422:
            return "E"
        if self.status == 429:
            return "G"
        if self.status >= 500:
            return "F"
        if self.status < 400:
            return "OK"
        return "E"


def req(method: str, path: str, token: str | None = None, body: dict | None = None):
    url = BASE + path if path.startswith("/") else f"{BASE}/{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode() if body is not None else None
    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=20) as resp:
            body_text = resp.read().decode()
            try:
                payload = json.loads(body_text)
                err = payload.get("error", {})
                return resp.status, err.get("code"), err.get("message")
            except json.JSONDecodeError:
                return resp.status, None, None
    except urllib.error.HTTPError as e:
        body_text = e.read().decode()
        try:
            payload = json.loads(body_text)
            err = payload.get("error", {})
            return e.code, err.get("code"), err.get("message")
        except json.JSONDecodeError:
            return e.code, None, body_text[:120]
    except Exception as e:  # noqa: BLE001
        return None, "NETWORK_ERROR", str(e)


def login(email: str, password: str) -> str | None:
    status, code, msg = req("POST", "/auth/login", body={"email": email, "password": password})
    if status != 200:
        print(f"LOGIN FAIL {email}: {status} {code} {msg}")
        return None
    with urllib.request.urlopen(
        urllib.request.Request(
            BASE + "/auth/login",
            data=json.dumps({"email": email, "password": password}).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        ),
        timeout=20,
    ) as resp:
        payload = json.loads(resp.read().decode())
        return payload.get("data", {}).get("tokens", {}).get("access_token")


def sweep(page: str, role: str, endpoints: list[tuple[str, str]], token: str | None) -> list[Row]:
    rows: list[Row] = []
    for method, path in endpoints:
        status, code, msg = req(method, path, token=token)
        rows.append(Row(page, role, method, path, status, code, msg))
    return rows


INVENTORY: list[tuple[str, str, list[tuple[str, str]]]] = [
    ("/discover", "guest", [
        ("GET", "/health"),
        ("GET", "/config"),
        ("GET", "/laundries"),
        ("GET", "/marketing/testimonials?limit=6"),
    ]),
    ("/orders", "customer", [
        ("GET", "/orders?limit=50&offset=0"),
        ("GET", "/users/me"),
    ]),
    ("/account", "customer", [
        ("GET", "/users/me"),
        ("GET", "/users/me/addresses"),
    ]),
    ("/partner", "partner", [
        ("GET", "/partner/analytics/summary"),
        ("GET", "/partner/orders"),
        ("GET", "/partner/operations/dashboard"),
        ("GET", "/partner/trust-score"),
    ]),
    ("/partner/orders", "partner", [("GET", "/partner/orders")]),
    ("/partner/operations", "partner", [
        ("GET", "/partner/operations/dashboard"),
        ("GET", "/partner/operations/pickups"),
        ("GET", "/partner/operations/deliveries"),
        ("GET", "/partner/operations/drivers"),
    ]),
    ("/partner/staff", "partner", [
        ("GET", "/partner/staff-management/dashboard"),
        ("GET", "/partner/staff-management"),
        ("GET", "/partner/staff-management/activity"),
    ]),
    ("/partner/services", "partner", [
        ("GET", "/partner/services"),
        ("GET", "/service-categories"),
    ]),
    ("/partner/settlements", "partner", [
        ("GET", "/partner/settlements?page=1&page_size=25"),
    ]),
    ("/partner/customers", "partner", [
        ("GET", "/partner/customer-insights/dashboard"),
        ("GET", "/partner/customer-insights/customers?limit=100"),
    ]),
    ("/partner/reviews", "partner", [
        ("GET", "/partner/review-management/analytics"),
        ("GET", "/partner/review-management/reviews"),
    ]),
    ("/partner/walk-in-orders", "partner", [
        ("GET", "/partner/walk-in-orders"),
        ("GET", "/partner/services"),
    ]),
    ("/partner/storefront", "partner", [
        ("GET", "/partner/storefront"),
        ("GET", "/partner/storefront/templates"),
        ("GET", "/partner/storefront/options"),
    ]),
    ("/admin", "admin", [
        ("GET", "/admin/dashboard"),
        ("GET", "/admin/analytics?days=14"),
        ("GET", "/admin/revenue-analytics/dashboard?period=last_30_days"),
    ]),
    ("/admin/orders", "admin", [
        ("GET", "/admin/orders?sort_by=created_at&sort_order=desc"),
    ]),
    ("/admin/customers", "admin", [
        ("GET", "/admin/users?role=customer"),
    ]),
    ("/admin/laundries", "admin", [
        ("GET", "/admin/laundries/management"),
    ]),
    ("/admin/disputes", "admin", [
        ("GET", "/complaints/admin/assignees"),
        ("GET", "/complaints/admin/metrics"),
        ("GET", "/complaints/admin/datatable"),
    ]),
    ("/admin/fraud", "admin", [
        ("GET", "/admin/fraud/summary"),
        ("GET", "/admin/fraud/alerts?status=open"),
    ]),
    ("/admin/settlements", "admin", [
        ("GET", "/admin/settlements/dashboard"),
        ("GET", "/admin/settlements/analytics"),
        ("GET", "/admin/settlements?page=1&page_size=25"),
        ("GET", "/admin/settlements/audit"),
    ]),
    ("/admin/business-health", "admin", [
        ("GET", "/admin/business-health"),
    ]),
    ("/admin/configuration", "admin", [
        ("GET", "/admin/platform-config"),
        ("GET", "/admin/laundries/management"),
    ]),
    ("/admin/announcements", "admin", [
        ("GET", "/admin/announcements?limit=50"),
    ]),
    ("/admin/trust-scores", "admin", [
        ("GET", "/admin/trust-scores"),
        ("GET", "/admin/laundry-trust-scores"),
    ]),
    ("/admin/revenue/analytics", "admin", [
        ("GET", "/admin/revenue-analytics/dashboard?period=last_30_days"),
        ("GET", "/admin/revenue-analytics/laundries?period=last_30_days&page=1&page_size=25"),
        ("GET", "/admin/revenue-analytics/charts?period=last_30_days"),
    ]),
    ("/admin/audit", "admin", [
        ("GET", "/admin/audit-logs?sort_by=created_at&sort_order=desc"),
    ]),
]


def main() -> None:
    tokens = {
        "customer": login("customer@demo.dlm", "Customer@1234"),
        "partner": login("partner.koramangala@demo.dlm", "Partner@1234"),
        "admin": login("admin@yopmail.com", "Admin@1234"),
    }
    print("Tokens:", {k: bool(v) for k, v in tokens.items()})

    all_rows: list[Row] = []
    for page, role, endpoints in INVENTORY:
        token = None if role == "guest" else tokens.get(role)
        all_rows.extend(sweep(page, role, endpoints, token))

    failures = [r for r in all_rows if r.failed]
    print(f"\nTotal: {len(all_rows)} | Failures: {len(failures)}\n")
    print("| # | Page route | Role | Method | Endpoint | Status | error.code | Category | Notes |")
    print("|---|------------|------|--------|----------|--------|--------------|----------|-------|")
    for i, r in enumerate(all_rows, 1):
        mark = "**FAIL**" if r.failed else "OK"
        notes = r.error_message or mark
        if len(notes) > 60:
            notes = notes[:57] + "..."
        print(
            f"| {i} | {r.page} | {r.role} | {r.method} | `{r.endpoint}` | {r.status or '—'} | {r.error_code or '—'} | {r.category()} | {notes} |"
        )

    print("\n## FAILURES ONLY")
    for i, r in enumerate(failures, 1):
        print(f"{i}. [{r.category()}] {r.page} {r.method} {r.endpoint} -> {r.status} {r.error_code} {r.error_message}")


if __name__ == "__main__":
    main()
