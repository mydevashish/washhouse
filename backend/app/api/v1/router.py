"""Aggregates all v1 routers under /api/v1."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.endpoints import (
    admin,
    auth,
    catalog,
    revenue_analytics,
    dispute_analytics,
    settlements,
    partner_settlements,
    staff_management,
    operations_center,
    business_health,
    partner_review_management,
    admin_review_management,
    partner_customer_insights,
    admin_announcements,
    admin_profit_sharing,
    admin_customer_experience,
    announcements,
    customer_experience,
    partner_service_catalog,
    partner_price_list,
    platform_config,
    platform_partner_dashboard,
    platform_partner_profit_sharing,
    complaints,
    complaint_photos,
    custody_timeline,
    delivery_otp,
    delivery_proof,
    health,
    inventory_verification,
    laundries,
    loyalty,
    marketing,
    orders,
    partner,
    partner_walk_in_orders,
    pickup_evidence,
    storefront,
    fraud_detection,
    laundry_trust_scores,
    trust_scores,
    payments,
    subscriptions,
    users,
    ws_orders,
)

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(laundries.router)
api_router.include_router(catalog.router)
api_router.include_router(orders.router)
api_router.include_router(inventory_verification.router)
api_router.include_router(delivery_otp.router)
api_router.include_router(delivery_proof.router)
api_router.include_router(custody_timeline.router)
api_router.include_router(partner.router)
api_router.include_router(partner_walk_in_orders.router)
api_router.include_router(pickup_evidence.router)
api_router.include_router(storefront.router)
api_router.include_router(admin.router)
api_router.include_router(revenue_analytics.router)
api_router.include_router(dispute_analytics.router)
api_router.include_router(settlements.router)
api_router.include_router(partner_settlements.router)
api_router.include_router(staff_management.router)
api_router.include_router(operations_center.router)
api_router.include_router(platform_config.router)
api_router.include_router(platform_config.public_router)
api_router.include_router(business_health.router)
api_router.include_router(partner_review_management.router)
api_router.include_router(admin_review_management.router)
api_router.include_router(partner_customer_insights.router)
api_router.include_router(admin_announcements.router)
api_router.include_router(admin_profit_sharing.router)
api_router.include_router(admin_customer_experience.router)
api_router.include_router(customer_experience.router)
api_router.include_router(partner_service_catalog.router)
api_router.include_router(partner_price_list.router)
api_router.include_router(announcements.router)
api_router.include_router(platform_partner_dashboard.router)
api_router.include_router(platform_partner_profit_sharing.router)
api_router.include_router(trust_scores.router)
api_router.include_router(laundry_trust_scores.router)
api_router.include_router(fraud_detection.router)
api_router.include_router(payments.router)
api_router.include_router(subscriptions.router)
api_router.include_router(complaints.router)
api_router.include_router(complaint_photos.router)
api_router.include_router(loyalty.router)
api_router.include_router(marketing.router)
api_router.include_router(ws_orders.router)
