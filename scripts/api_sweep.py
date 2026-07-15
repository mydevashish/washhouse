"""Sweep API endpoints for diagnose-api-errors inventory."""
from __future__ import annotations

import json
import urllib.error
import urllib.request

BASE = "http://localhost:8000/api/v1"


def req(method: str, path: str, token: str | None = None, body: dict | None = None):
    url = BASE + path
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


def login(email: str, password: str) -> tuple[str | None, int | None, str | None, str | None]:
    status, code, msg = req("POST", "/auth/login", body={"email": email, "password": password})
    if status != 200:
        return None, status, code, msg
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
        tokens = payload.get("data", {}).get("tokens", {})
        return tokens.get("access_token"), status, code, msg


def sweep(label: str, endpoints: list[tuple[str, str]], token: str | None = None):
    print(f"\n=== {label} ===")
    rows = []
    for method, path in endpoints:
        status, code, msg = req(method, path, token=token)
        fail = status is None or status >= 400
        rows.append((method, path, status, code, msg, fail))
        mark = "FAIL" if fail else "OK"
        print(f"{mark:4} {method:4} {path:48} -> {status} code={code} msg={msg}")
    return rows


def main():
    public = [
        ("GET", "/health"),
        ("GET", "/config"),
        ("GET", "/laundries"),
        ("GET", "/marketing/testimonials?limit=6"),
    ]
    sweep("PUBLIC", public)

    accounts = [
        ("customer", "customer@demo.dlm", "Customer@1234"),
        ("partner", "partner.koramangala@demo.dlm", "Partner@1234"),
        ("admin", "admin@yopmail.com", "Admin@1234"),
    ]
    tokens: dict[str, str | None] = {}
    for role, email, pw in accounts:
        tok, st, code, msg = login(email, pw)
        tokens[role] = tok
        print(f"\nLOGIN {role}: status={st} code={code} token={'yes' if tok else 'no'} msg={msg}")

    customer_eps = [
        ("GET", "/orders"),
        ("GET", "/users/me"),
        ("GET", "/users/me/addresses"),
        ("GET", "/complaints"),
    ]
    partner_eps = [
        ("GET", "/partner/analytics/summary"),
        ("GET", "/partner/orders"),
        ("GET", "/partner/services"),
        ("GET", "/partner/staff"),
        ("GET", "/partner/operations/dashboard"),
        ("GET", "/partner/settlements/summary"),
        ("GET", "/partner/customers/insights"),
    ]
    admin_eps = [
        ("GET", "/admin/dashboard"),
        ("GET", "/admin/analytics"),
        ("GET", "/admin/laundries"),
        ("GET", "/admin/customers"),
        ("GET", "/admin/orders"),
        ("GET", "/complaints/admin/metrics"),
        ("GET", "/admin/fraud-detection/summary"),
        ("GET", "/admin/business-health"),
        ("GET", "/admin/platform-config"),
        ("GET", "/admin/announcements"),
        ("GET", "/admin/settlements/dashboard"),
        ("GET", "/admin/trust-scores"),
    ]

    sweep("CUSTOMER", customer_eps, tokens.get("customer"))
    sweep("PARTNER", partner_eps, tokens.get("partner"))
    sweep("ADMIN", admin_eps, tokens.get("admin"))


if __name__ == "__main__":
    main()
