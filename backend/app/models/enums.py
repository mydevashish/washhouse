"""Shared PostgreSQL enums."""

from __future__ import annotations

import enum


class UserRole(str, enum.Enum):
    customer = "customer"
    partner = "partner"
    partner_staff = "partner_staff"
    admin = "admin"
    super_admin = "super_admin"
    delivery = "delivery"
    support_agent = "support_agent"
    operations_manager = "operations_manager"
    platform_partner = "platform_partner"


class OtpPurpose(str, enum.Enum):
    login = "login"
    verify_phone = "verify_phone"
    password_reset = "password_reset"


class LaundryStatus(str, enum.Enum):
    pending_approval = "pending_approval"
    approved = "approved"
    rejected = "rejected"
    suspended = "suspended"


class OrderSource(str, enum.Enum):
    online = "online"
    walk_in = "walk_in"


class OrderStatus(str, enum.Enum):
    confirmed = "confirmed"
    pickup_assigned = "pickup_assigned"
    picked_up = "picked_up"
    washing = "washing"
    ironing = "ironing"
    ready = "ready"
    out_for_delivery = "out_for_delivery"
    delivered = "delivered"
    cancelled = "cancelled"


class PaymentStatus(str, enum.Enum):
    pending = "pending"
    pending_cod = "pending_cod"
    paid = "paid"
    failed = "failed"
    refunded = "refunded"


class PaymentMethod(str, enum.Enum):
    razorpay = "razorpay"
    cod = "cod"


class SubscriptionStatus(str, enum.Enum):
    active = "active"
    past_due = "past_due"
    cancelled = "cancelled"
    expired = "expired"


class ComplaintStatus(str, enum.Enum):
    open = "open"
    investigating = "investigating"
    awaiting_customer = "awaiting_customer"
    awaiting_partner = "awaiting_partner"
    resolved = "resolved"
    rejected = "rejected"
    escalated = "escalated"
    closed = "closed"


class DisputePriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class ComplaintType(str, enum.Enum):
    missing_item = "missing_item"
    damaged_item = "damaged_item"
    wrong_item = "wrong_item"
    late_delivery = "late_delivery"
    quality_issue = "quality_issue"
    missing_items = "missing_items"
    damaged_items = "damaged_items"
    delayed_delivery = "delayed_delivery"
    refund_request = "refund_request"
    payment_issue = "payment_issue"
    other = "other"


class TrustScoreLevel(str, enum.Enum):
    gold = "gold"
    silver = "silver"
    bronze = "bronze"
    high_risk = "high_risk"


class TrustScoreEventType(str, enum.Enum):
    refund_request = "refund_request"
    dispute_filed = "dispute_filed"
    chargeback = "chargeback"
    failed_payment = "failed_payment"
    fake_claim = "fake_claim"
    successful_order = "successful_order"
    positive_review = "positive_review"
    long_history = "long_history"


class LaundryTrustLevel(str, enum.Enum):
    premium = "premium"
    trusted = "trusted"
    verified = "verified"
    under_review = "under_review"


class FraudRiskLevel(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class FraudSubjectType(str, enum.Enum):
    customer = "customer"
    partner = "partner"


class FraudSignalType(str, enum.Enum):
    customer_dispute_spike = "customer_dispute_spike"
    customer_refund_rate = "customer_refund_rate"
    customer_payment_failures = "customer_payment_failures"
    customer_cancellations = "customer_cancellations"
    partner_excessive_complaints = "partner_excessive_complaints"
    partner_inventory_mismatch = "partner_inventory_mismatch"
    partner_delivery_fraud = "partner_delivery_fraud"


class FraudAlertStatus(str, enum.Enum):
    open = "open"
    acknowledged = "acknowledged"
    resolved = "resolved"


class PartnerStaffRole(str, enum.Enum):
    owner = "owner"
    manager = "manager"
    pickup_agent = "pickup_agent"
    delivery_agent = "delivery_agent"
    operator = "operator"
    support_staff = "support_staff"
    # Legacy values (pre-migration rows)
    pickup_only = "pickup_only"
    delivery_only = "delivery_only"
    inventory = "inventory"
    full_access = "full_access"


class StaffActivityAction(str, enum.Enum):
    login = "login"
    logout = "logout"
    order_update = "order_update"
    assignment = "assignment"
    status_change = "status_change"
    staff_created = "staff_created"
    staff_updated = "staff_updated"
    staff_deactivated = "staff_deactivated"
    staff_suspended = "staff_suspended"
    staff_unsuspended = "staff_unsuspended"
    password_reset = "password_reset"


class TaskAssignmentType(str, enum.Enum):
    pickup = "pickup"
    delivery = "delivery"


class TaskAssignmentStatus(str, enum.Enum):
    scheduled = "scheduled"
    assigned = "assigned"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"
    failed = "failed"
    returned = "returned"


class ReviewStatus(str, enum.Enum):
    published = "published"
    hidden = "hidden"
    removed = "removed"
    pending_moderation = "pending_moderation"


class InventoryItemType(str, enum.Enum):
    shirts = "shirts"
    trousers = "trousers"
    sarees = "sarees"
    jackets = "jackets"
    bedsheets = "bedsheets"
    blankets = "blankets"
    curtains = "curtains"
    other = "other"


INVENTORY_ITEM_TYPES: tuple[InventoryItemType, ...] = tuple(InventoryItemType)


class InventoryVerificationStatus(str, enum.Enum):
    pending_customer = "pending_customer"
    locked = "locked"
    change_pending = "change_pending"


class InventoryHistoryAction(str, enum.Enum):
    partner_recorded = "partner_recorded"
    customer_confirmed = "customer_confirmed"
    locked = "locked"
    change_requested = "change_requested"
    admin_approved = "admin_approved"
    admin_rejected = "admin_rejected"


class InventoryChangeRequestStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class DeliveryOtpStatus(str, enum.Enum):
    active = "active"
    verified = "verified"
    expired = "expired"
    locked = "locked"


class AuditAction(str, enum.Enum):
    user_register = "user_register"
    user_login = "user_login"
    user_logout = "user_logout"
    role_change = "role_change"
    token_refresh = "token_refresh"
    token_revoke_all = "token_revoke_all"
    delivery_otp_generated = "delivery_otp_generated"
    delivery_otp_verified = "delivery_otp_verified"
    delivery_otp_failed = "delivery_otp_failed"
    delivery_otp_agent_locked = "delivery_otp_agent_locked"
    dispute_status_change = "dispute_status_change"
    dispute_assigned = "dispute_assigned"
    dispute_note_added = "dispute_note_added"
    dispute_bulk_action = "dispute_bulk_action"
    dispute_escalated = "dispute_escalated"
    dispute_closed = "dispute_closed"
    settlement_created = "settlement_created"
    settlement_approved = "settlement_approved"
    settlement_rejected = "settlement_rejected"
    settlement_payout_released = "settlement_payout_released"
    settlement_adjustment = "settlement_adjustment"
    settlement_status_change = "settlement_status_change"
    settlement_held = "settlement_held"
    settlement_released_from_hold = "settlement_released_from_hold"
    platform_config_change = "platform_config_change"
    review_reply = "review_reply"
    review_abuse_report = "review_abuse_report"
    review_moderated = "review_moderated"
    review_removed = "review_removed"
    review_restored = "review_restored"
    announcement_created = "announcement_created"
    announcement_updated = "announcement_updated"
    announcement_scheduled = "announcement_scheduled"
    announcement_published = "announcement_published"
    announcement_archived = "announcement_archived"
    ownership_partner_created = "ownership_partner_created"
    ownership_partner_updated = "ownership_partner_updated"
    ownership_partner_deactivated = "ownership_partner_deactivated"
    platform_expense_recorded = "platform_expense_recorded"
    platform_expense_deleted = "platform_expense_deleted"
    profit_share_finalized = "profit_share_finalized"
    profit_share_payout_released = "profit_share_payout_released"


class PlatformExpenseCategory(str, enum.Enum):
    operations = "operations"
    marketing = "marketing"
    technology = "technology"
    personnel = "personnel"
    other = "other"


class ProfitSharePeriodStatus(str, enum.Enum):
    draft = "draft"
    finalized = "finalized"


class ProfitSharePayoutStatus(str, enum.Enum):
    pending = "pending"
    paid = "paid"


class EngagementEventType(str, enum.Enum):
    store_view = "store_view"
    service_view = "service_view"
    call_click = "call_click"
    whatsapp_click = "whatsapp_click"
    callback_request = "callback_request"
    question_asked = "question_asked"


class QuestionStatus(str, enum.Enum):
    pending = "pending"
    answered = "answered"
    hidden = "hidden"
    removed = "removed"


class CallbackRequestStatus(str, enum.Enum):
    pending = "pending"
    contacted = "contacted"
    cancelled = "cancelled"


class AnnouncementStatus(str, enum.Enum):
    draft = "draft"
    scheduled = "scheduled"
    published = "published"
    archived = "archived"


class AnnouncementTarget(str, enum.Enum):
    all_users = "all_users"
    customers = "customers"
    partners = "partners"
    specific_laundries = "specific_laundries"
    specific_cities = "specific_cities"


class AnnouncementEventType(str, enum.Enum):
    view = "view"
    click = "click"
    acknowledge = "acknowledge"


class SettlementStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    processing = "processing"
    paid = "paid"
    failed = "failed"
    cancelled = "cancelled"
    on_hold = "on_hold"


class SettlementEligibility(str, enum.Enum):
    pending_window = "pending_window"
    eligible = "eligible"
    in_settlement = "in_settlement"
    settled = "settled"
    held_dispute = "held_dispute"


class CustodyEventType(str, enum.Enum):
    order_confirmed = "order_confirmed"
    pickup_assigned = "pickup_assigned"
    pickup_photos_uploaded = "pickup_photos_uploaded"
    inventory_recorded = "inventory_recorded"
    inventory_confirmed = "inventory_confirmed"
    pickup_completed = "pickup_completed"
    washing_started = "washing_started"
    ironing_started = "ironing_started"
    packaging_completed = "packaging_completed"
    delivery_assigned = "delivery_assigned"
    delivery_proof_uploaded = "delivery_proof_uploaded"
    otp_verified = "otp_verified"
    delivered = "delivered"
    order_cancelled = "order_cancelled"


class CustodyActorRole(str, enum.Enum):
    customer = "customer"
    partner = "partner"
    admin = "admin"
    system = "system"
    delivery = "delivery"


class MarketingContactSubject(str, enum.Enum):
    general = "general"
    order_help = "order-help"
    franchise = "franchise"
    partnership = "partnership"
    legal_privacy = "legal-privacy"


class MarketingInvestmentRange(str, enum.Enum):
    range_10_25 = "10-25"
    range_25_50 = "25-50"
    range_50_plus = "50-plus"
    unsure = "unsure"
