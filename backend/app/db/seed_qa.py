"""Comprehensive QA / demo dataset for manual testing.

Run once after migrations:
    python scripts/seed_qa.py

Idempotent via platform_settings key `qa_seed_version`.
"""

from __future__ import annotations

import random
import secrets
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from uuid import uuid4

import structlog
from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
from app.models.audit_log import AuditLog
from app.models.complaint import Complaint
from app.models.enums import (
    AuditAction,
    ComplaintStatus,
    ComplaintType,
    FraudAlertStatus,
    FraudRiskLevel,
    FraudSignalType,
    FraudSubjectType,
    LaundryStatus,
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
    TrustScoreEventType,
    UserRole,
)
from app.models.fraud_alert import FraudAlert
from app.models.laundry import Laundry, LaundryService
from app.models.notification import Notification
from app.models.order import Order, OrderItem, OrderStatusEvent
from app.models.platform import PlatformSetting
from app.models.review import Review
from app.models.trust_score import CustomerTrustScoreEvent
from app.models.user import User
from app.models.user_address import UserAddress

log = structlog.get_logger(__name__)

QA_SEED_KEY = "qa_seed_version"
QA_SEED_VERSION = "1"
QA_PASSWORD = "Demo@1234"

FIRST_NAMES = [
    "Aarav", "Priya", "Rahul", "Ananya", "Vikram", "Sneha", "Arjun", "Kavya",
    "Rohan", "Meera", "Aditya", "Isha", "Karan", "Divya", "Nikhil", "Pooja",
]
LAST_NAMES = [
    "Sharma", "Patel", "Reddy", "Iyer", "Gupta", "Nair", "Singh", "Das",
    "Menon", "Khan", "Rao", "Verma", "Pillai", "Joshi", "Chatterjee",
]
CITIES = [
    ("Bengaluru", "Karnataka", "560034"),
    ("Bengaluru", "Karnataka", "560038"),
    ("Bengaluru", "Karnataka", "560102"),
    ("Mumbai", "Maharashtra", "400001"),
    ("Hyderabad", "Telangana", "500001"),
]
LAUNDRY_PREFIXES = ["QuickWash", "Sparkle", "FreshFold", "CleanHub", "WashPro", "LaundryBox"]

SPECIAL_ACCOUNTS = [
    ("admin@demo.dlm", "DLM Admin", UserRole.admin, None, None, FraudRiskLevel.low),
    ("platform-partner@demo.dlm", "Platform Partner Demo", UserRole.platform_partner, None, None, FraudRiskLevel.low),
    ("support@demo.dlm", "Support Agent", UserRole.support_agent, None, None, FraudRiskLevel.low),
    ("ops@demo.dlm", "Operations Manager", UserRole.operations_manager, None, None, FraudRiskLevel.low),
    ("partner.koramangala@demo.dlm", "Rajesh Kumar", UserRole.partner, None, None, FraudRiskLevel.low),
    ("customer@demo.dlm", "Demo Customer", UserRole.customer, 100, "standard", FraudRiskLevel.low),
    ("vip@demo.dlm", "VIP Customer", UserRole.customer, 92, "vip", FraudRiskLevel.low),
    ("highrisk@demo.dlm", "High Risk Customer", UserRole.customer, 38, "high_risk", FraudRiskLevel.critical),
    ("blocked@demo.dlm", "Blocked Customer", UserRole.customer, 25, "blocked", FraudRiskLevel.critical),
]

ORDER_STATUS_WEIGHTS: list[tuple[OrderStatus, int]] = [
    (OrderStatus.confirmed, 150),
    (OrderStatus.pickup_assigned, 120),
    (OrderStatus.picked_up, 100),
    (OrderStatus.washing, 80),
    (OrderStatus.ironing, 70),
    (OrderStatus.ready, 90),
    (OrderStatus.out_for_delivery, 100),
    (OrderStatus.delivered, 1100),
    (OrderStatus.cancelled, 90),
]


async def ensure_qa_seed() -> dict[str, int]:
    async with AsyncSessionLocal() as session:
        marker = await session.execute(
            select(PlatformSetting).where(PlatformSetting.key == QA_SEED_KEY),
        )
        if marker.scalar_one_or_none():
            log.info("qa_seed.already_applied")
            return await _count_summary(session)

        random.seed(42)
        stats: dict[str, int] = {}

        await _ensure_special_accounts(session)
        partners = await _ensure_partners(session, target=20)
        laundries = await _ensure_laundries(session, partners, target=15)
        customers = await _ensure_customers(session, target=100)
        stats["orders"] = await _seed_orders(session, customers, laundries, target=2000)
        stats["reviews"] = await _seed_reviews(session, target=50)
        stats["disputes"] = await _seed_disputes(session, target=20)
        stats["refunds"] = await _mark_refunds(session, target=30)
        stats["trust_events"] = await _seed_trust_events(session)
        stats["fraud_alerts"] = await _seed_fraud_alerts(session)
        stats["audit_logs"] = await _seed_audit_logs(session, target=100)
        stats["notifications"] = await _seed_notifications(session, target=150)

        session.add(PlatformSetting(key=QA_SEED_KEY, value=QA_SEED_VERSION))
        await session.commit()
        log.info("qa_seed.complete", **stats)
        summary = await _count_summary(session)
        summary.update(stats)
        return summary


async def _count_summary(session) -> dict[str, int]:
    from sqlalchemy import func, text

    out: dict[str, int] = {}
    for table in (
        "users", "laundries", "orders", "reviews", "complaints",
        "fraud_alerts", "customer_trust_score_events", "audit_logs", "notifications",
    ):
        r = await session.execute(text(f"SELECT COUNT(*) FROM {table}"))
        out[table] = int(r.scalar_one())
    r = await session.execute(
        text("SELECT COUNT(*) FROM orders WHERE payment_status = 'refunded'"),
    )
    out["refunded_orders"] = int(r.scalar_one())
    return out


async def _ensure_special_accounts(session) -> None:
    for email, name, role, trust, _tag, fraud in SPECIAL_ACCOUNTS:
        email_l = email.lower()
        result = await session.execute(select(User).where(User.email == email_l))
        user = result.scalar_one_or_none()
        if not user:
            user = User(
                email=email_l,
                password_hash=hash_password(
                    "Admin@1234" if role == UserRole.admin else
                    "Support@1234" if role == UserRole.support_agent else
                    "Ops@1234" if role == UserRole.operations_manager else
                    "Partner@1234" if role == UserRole.partner else
                    "Customer@1234",
                ),
                full_name=name,
                role=role,
                is_email_verified=True,
                trust_score=trust if trust is not None else (100 if role == UserRole.customer else 70),
                fraud_risk_level=fraud,
            )
            session.add(user)
            await session.flush()
        elif trust is not None:
            user.trust_score = trust
            user.fraud_risk_level = fraud
        if role == UserRole.customer:
            addr = await session.execute(
                select(UserAddress).where(UserAddress.user_id == user.id).limit(1),
            )
            if not addr.scalar_one_or_none():
                city, state, pin = CITIES[0]
                session.add(
                    UserAddress(
                        user_id=user.id,
                        label="Home",
                        line1=f"42 {name} Street",
                        city=city,
                        state=state,
                        pincode=pin,
                        is_default=True,
                    ),
                )


async def _ensure_partners(session, *, target: int) -> list[User]:
    result = await session.execute(select(User).where(User.role == UserRole.partner))
    partners = list(result.scalars().all())
    i = len(partners)
    while i < target:
        fn, ln = random.choice(FIRST_NAMES), random.choice(LAST_NAMES)
        email = f"partner{i + 1}.{fn.lower()}@demo.dlm"
        existing = await session.execute(select(User).where(User.email == email))
        if existing.scalar_one_or_none():
            i += 1
            continue
        p = User(
            email=email,
            password_hash=hash_password(QA_PASSWORD),
            full_name=f"{fn} {ln}",
            role=UserRole.partner,
            is_email_verified=True,
        )
        session.add(p)
        partners.append(p)
        i += 1
    await session.flush()
    return partners


async def _ensure_laundries(session, partners: list[User], *, target: int) -> list[Laundry]:
    result = await session.execute(select(Laundry))
    laundries = list(result.scalars().all())
    idx = len(laundries)
    while idx < target:
        owner = partners[idx % len(partners)]
        city, _, pin = CITIES[idx % len(CITIES)]
        slug = f"qa-laundry-{idx + 1}"
        existing = await session.execute(select(Laundry).where(Laundry.slug == slug))
        if existing.scalar_one_or_none():
            idx += 1
            continue
        prefix = LAUNDRY_PREFIXES[idx % len(LAUNDRY_PREFIXES)]
        status = LaundryStatus.approved
        if idx == target - 1:
            status = LaundryStatus.pending_approval
        elif idx == target - 2:
            status = LaundryStatus.suspended
        laundry = Laundry(
            owner_user_id=owner.id,
            name=f"{prefix} {city.split()[0] if ' ' not in city else city}",
            slug=slug,
            city=city,
            address_line=f"{100 + idx} Main Road, {city}, {pin}",
            description=f"QA seed laundry #{idx + 1}",
            status=status,
            is_verified=status == LaundryStatus.approved,
            avg_rating=Decimal(str(round(random.uniform(3.8, 4.9), 2))),
            review_count=random.randint(5, 200),
            tags=["qa", "seed"],
        )
        session.add(laundry)
        await session.flush()
        for svc_name, cat, unit, price in [
            ("Wash & Fold", "wash", "kg", Decimal("79")),
            ("Dry Clean", "dry_clean", "piece", Decimal("149")),
            ("Iron Only", "iron", "piece", Decimal("39")),
        ]:
            session.add(
                LaundryService(
                    laundry_id=laundry.id,
                    name=svc_name,
                    category=cat,
                    unit=unit,
                    price_inr=price,
                    is_active=True,
                ),
            )
        laundries.append(laundry)
        idx += 1
    # Multi-branch: second laundry for koramangala partner
    koramangala = await session.execute(
        select(User).where(User.email == "partner.koramangala@demo.dlm"),
    )
    owner = koramangala.scalar_one_or_none()
    if owner:
        branch_slug = "demo-quick-wash-koramangala-branch2"
        ex = await session.execute(select(Laundry).where(Laundry.slug == branch_slug))
        if not ex.scalar_one_or_none() and len(laundries) < target + 1:
            city, _, pin = CITIES[0]
            branch = Laundry(
                owner_user_id=owner.id,
                name="Quick Wash Koramangala — Branch 2",
                slug=branch_slug,
                city=city,
                address_line=f"88 Koramangala 5th Block, {pin}",
                description="Second branch for multi-location QA",
                status=LaundryStatus.approved,
                is_verified=True,
                avg_rating=Decimal("4.50"),
                review_count=45,
                tags=["qa", "multi-branch"],
            )
            session.add(branch)
            await session.flush()
            for svc_name, cat, unit, price in [
                ("Wash & Fold", "wash", "kg", Decimal("85")),
                ("Express Wash", "wash", "kg", Decimal("99")),
            ]:
                session.add(
                    LaundryService(
                        laundry_id=branch.id,
                        name=svc_name,
                        category=cat,
                        unit=unit,
                        price_inr=price,
                        is_active=True,
                    ),
                )
            laundries.append(branch)
    await session.flush()
    return laundries


async def _ensure_customers(session, *, target: int) -> list[User]:
    result = await session.execute(select(User).where(User.role == UserRole.customer))
    customers = list(result.scalars().all())
    i = len(customers)
    while i < target:
        fn, ln = random.choice(FIRST_NAMES), random.choice(LAST_NAMES)
        email = f"customer{i + 1}.{fn.lower()}@demo.dlm"
        ex = await session.execute(select(User).where(User.email == email))
        if ex.scalar_one_or_none():
            i += 1
            continue
        u = User(
            email=email,
            password_hash=hash_password(QA_PASSWORD),
            full_name=f"{fn} {ln}",
            role=UserRole.customer,
            is_email_verified=True,
            trust_score=random.randint(55, 100),
            fraud_risk_level=FraudRiskLevel.low,
        )
        session.add(u)
        await session.flush()
        city, state, pin = CITIES[i % len(CITIES)]
        session.add(
            UserAddress(
                user_id=u.id,
                label="Home",
                line1=f"{10 + i} Residency Road",
                city=city,
                state=state,
                pincode=pin,
                is_default=True,
            ),
        )
        customers.append(u)
        i += 1
    await session.flush()
    return customers


def _build_status_list() -> list[OrderStatus]:
    statuses: list[OrderStatus] = []
    for status, count in ORDER_STATUS_WEIGHTS:
        statuses.extend([status] * count)
    return statuses


async def _seed_orders(
    session,
    customers: list[User],
    laundries: list[Laundry],
    *,
    target: int,
) -> int:
    approved = [l for l in laundries if l.status == LaundryStatus.approved]
    if not approved:
        return 0

    services_map: dict = {}
    for laundry in approved:
        r = await session.execute(
            select(LaundryService).where(
                LaundryService.laundry_id == laundry.id,
                LaundryService.is_active.is_(True),
            ),
        )
        services_map[laundry.id] = list(r.scalars().all())

    statuses = _build_status_list()
    random.shuffle(statuses)
    now = datetime.now(UTC)
    created = 0
    batch: list[Order] = []

    for i in range(target):
        customer = customers[i % len(customers)]
        laundry = approved[i % len(approved)]
        services = services_map.get(laundry.id, [])
        if not services:
            continue
        svc = services[0]
        addr_r = await session.execute(
            select(UserAddress).where(UserAddress.user_id == customer.id).limit(1),
        )
        address = addr_r.scalar_one_or_none()
        if not address:
            continue

        status = statuses[i % len(statuses)]
        qty = random.randint(1, 5)
        subtotal = svc.price_inr * qty
        delivery_fee = Decimal("49")
        taxable = subtotal + delivery_fee
        cgst = (taxable * Decimal("18") / Decimal("200")).quantize(Decimal("0.01"))
        total = taxable + cgst * 2

        if status == OrderStatus.delivered:
            pay_status = PaymentStatus.paid
            pay_method = random.choice([PaymentMethod.razorpay, PaymentMethod.cod])
        elif status == OrderStatus.cancelled:
            pay_status = random.choice([PaymentStatus.pending, PaymentStatus.failed])
            pay_method = None
        else:
            pay_status = random.choice([PaymentStatus.pending, PaymentStatus.pending_cod, PaymentStatus.paid])
            pay_method = PaymentMethod.cod if pay_status == PaymentStatus.pending_cod else PaymentMethod.razorpay

        days_ago = random.randint(0, 90)
        pickup_at = now - timedelta(days=days_ago, hours=random.randint(8, 18))
        delivery_at = pickup_at + timedelta(hours=random.randint(24, 72))

        order = Order(
            user_id=customer.id,
            laundry_id=laundry.id,
            address_id=address.id,
            status=status,
            tracking_code=f"QA{secrets.token_hex(4).upper()}",
            pickup_at=pickup_at,
            delivery_at=delivery_at,
            subtotal_inr=subtotal,
            delivery_fee_inr=delivery_fee,
            cgst_inr=cgst,
            sgst_inr=cgst,
            total_inr=total,
            commission_rate=Decimal("10"),
            payment_status=pay_status,
            payment_method=pay_method,
        )
        batch.append(order)
        created += 1

        if len(batch) >= 200:
            session.add_all(batch)
            await session.flush()
            for o in batch:
                svc_pick = services_map[o.laundry_id][0]
                session.add(
                    OrderItem(
                        order_id=o.id,
                        service_id=svc_pick.id,
                        service_name=svc_pick.name,
                        quantity=random.randint(1, 4),
                        unit_price_inr=svc_pick.price_inr,
                        line_total_inr=svc_pick.price_inr * 2,
                    ),
                )
                session.add(
                    OrderStatusEvent(order_id=o.id, status=OrderStatus.confirmed, note="Order confirmed"),
                )
                session.add(
                    OrderStatusEvent(order_id=o.id, status=o.status, note=f"QA seed status: {o.status.value}"),
                )
            batch.clear()

    if batch:
        session.add_all(batch)
        await session.flush()
        for o in batch:
            svc_pick = services_map[o.laundry_id][0]
            session.add(
                OrderItem(
                    order_id=o.id,
                    service_id=svc_pick.id,
                    service_name=svc_pick.name,
                    quantity=2,
                    unit_price_inr=svc_pick.price_inr,
                    line_total_inr=svc_pick.price_inr * 2,
                ),
            )
            session.add(
                OrderStatusEvent(order_id=o.id, status=OrderStatus.confirmed, note="Order confirmed"),
            )
            session.add(
                OrderStatusEvent(order_id=o.id, status=o.status, note=f"QA seed status: {o.status.value}"),
            )

    await session.flush()
    return created


async def _seed_reviews(session, *, target: int) -> int:
    result = await session.execute(
        select(Order).where(Order.status == OrderStatus.delivered).limit(target * 2),
    )
    orders = list(result.scalars().all())
    random.shuffle(orders)
    count = 0
    for order in orders[:target]:
        ex = await session.execute(select(Review).where(Review.order_id == order.id))
        if ex.scalar_one_or_none():
            continue
        session.add(
            Review(
                laundry_id=order.laundry_id,
                user_id=order.user_id,
                order_id=order.id,
                rating=random.randint(3, 5),
                comment=random.choice([
                    "Great service, clothes came back fresh.",
                    "On-time delivery, will order again.",
                    "Good quality wash, friendly pickup.",
                    "Slightly delayed but acceptable.",
                ]),
            ),
        )
        count += 1
    await session.flush()
    return count


async def _seed_disputes(session, *, target: int) -> int:
    types = list(ComplaintType)
    statuses = list(ComplaintStatus)
    result = await session.execute(
        select(Order).where(Order.status == OrderStatus.delivered).limit(target * 3),
    )
    orders = list(result.scalars().all())
    random.shuffle(orders)
    count = 0
    for order in orders[:target]:
        ex = await session.execute(select(Complaint).where(Complaint.order_id == order.id))
        if ex.scalar_one_or_none():
            continue
        session.add(
            Complaint(
                user_id=order.user_id,
                order_id=order.id,
                complaint_type=random.choice(types),
                description=random.choice([
                    "Missing shirt from my order.",
                    "Fabric damaged during wash.",
                    "Delivery was late by 2 days.",
                    "Wrong items returned.",
                    "Requesting refund for poor quality.",
                ]),
                status=random.choice(statuses),
            ),
        )
        count += 1
    await session.flush()
    return count


async def _mark_refunds(session, *, target: int) -> int:
    result = await session.execute(
        select(Order).where(
            Order.status == OrderStatus.delivered,
            Order.payment_status == PaymentStatus.paid,
        ).limit(target * 2),
    )
    orders = list(result.scalars().all())
    random.shuffle(orders)
    count = 0
    for order in orders[:target]:
        order.payment_status = PaymentStatus.refunded
        count += 1
    await session.flush()
    return count


async def _seed_trust_events(session) -> int:
    count = 0
    mappings = [
        ("vip@demo.dlm", TrustScoreEventType.positive_review, 3),
        ("highrisk@demo.dlm", TrustScoreEventType.dispute_filed, -10),
        ("highrisk@demo.dlm", TrustScoreEventType.refund_request, -15),
        ("blocked@demo.dlm", TrustScoreEventType.chargeback, -30),
        ("blocked@demo.dlm", TrustScoreEventType.fake_claim, -25),
    ]
    for email, event_type, delta in mappings:
        r = await session.execute(select(User).where(User.email == email.lower()))
        user = r.scalar_one_or_none()
        if not user:
            continue
        before = user.trust_score
        after = max(0, min(100, before + delta))
        user.trust_score = after
        session.add(
            CustomerTrustScoreEvent(
                user_id=user.id,
                event_type=event_type,
                delta=delta,
                score_before=before,
                score_after=after,
                reference_type="qa_seed",
                reference_id=uuid4(),
            ),
        )
        count += 1
    await session.flush()
    return count


async def _seed_fraud_alerts(session) -> int:
    count = 0
    specs = [
        ("highrisk@demo.dlm", FraudSubjectType.customer, FraudSignalType.customer_dispute_spike, FraudRiskLevel.high),
        ("blocked@demo.dlm", FraudSubjectType.customer, FraudSignalType.customer_refund_rate, FraudRiskLevel.critical),
        ("partner.hsr@demo.dlm", FraudSubjectType.partner, FraudSignalType.partner_excessive_complaints, FraudRiskLevel.medium),
    ]
    for email, subject_type, signal, risk in specs:
        r = await session.execute(select(User).where(User.email == email.lower()))
        user = r.scalar_one_or_none()
        if not user:
            continue
        subject_id = user.id
        if subject_type == FraudSubjectType.partner:
            lr = await session.execute(select(Laundry).where(Laundry.owner_user_id == user.id).limit(1))
            laundry = lr.scalar_one_or_none()
            if not laundry:
                continue
            subject_id = laundry.id
        session.add(
            FraudAlert(
                subject_type=subject_type,
                subject_id=subject_id,
                signal_type=signal,
                risk_level=risk,
                title=f"QA seed alert: {email}",
                description=f"Automated QA fraud alert for {signal.value}",
                status=FraudAlertStatus.open,
                metadata_={"source": "qa_seed"},
            ),
        )
        count += 1
    await session.flush()
    return count


async def _seed_audit_logs(session, *, target: int) -> int:
    r = await session.execute(select(User).limit(10))
    users = list(r.scalars().all())
    actions = list(AuditAction)
    count = 0
    for i in range(target):
        session.add(
            AuditLog(
                actor_user_id=users[i % len(users)].id if users else None,
                action=random.choice(actions),
                resource_type="order",
                resource_id=str(uuid4()),
                ip_address="127.0.0.1",
                metadata_json={"source": "qa_seed", "index": i},
            ),
        )
        count += 1
    await session.flush()
    return count


async def _seed_notifications(session, *, target: int) -> int:
    r = await session.execute(select(User).where(User.role == UserRole.customer).limit(50))
    customers = list(r.scalars().all())
    count = 0
    for i in range(target):
        user = customers[i % len(customers)] if customers else None
        if not user:
            break
        session.add(
            Notification(
                user_id=user.id,
                title=random.choice(["Order update", "Delivery scheduled", "Review reminder"]),
                body=random.choice([
                    "Your laundry is ready for delivery.",
                    "Pickup scheduled for tomorrow morning.",
                    "How was your recent order?",
                ]),
                is_read=i % 3 == 0,
            ),
        )
        count += 1
    await session.flush()
    return count
