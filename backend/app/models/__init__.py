"""ORM models — import all for Alembic autogenerate."""

from app.models.announcement import Announcement, AnnouncementEvent
from app.models.customer_experience import (
    CallbackRequest,
    CustomerQuestion,
    PlatformFacilityTag,
    ServiceCategory,
    StorefrontEngagementEvent,
)
from app.models.complaint import Complaint
from app.models.complaint_internal_note import ComplaintInternalNote
from app.models.complaint_photo import ComplaintPhoto
from app.models.complaint_status_event import ComplaintStatusEvent
from app.models.fraud_alert import FraudAlert
from app.models.trust_score import CustomerTrustScoreEvent
from app.models.custody_event import OrderCustodyEvent
from app.models.delivery_otp import OrderDeliveryOtp
from app.models.delivery_proof import DeliveryProofPhoto
from app.models.inventory_verification import (
    OrderInventoryChangeRequest,
    OrderInventoryHistory,
    OrderInventoryItem,
    OrderInventoryVerification,
)
from app.models.laundry import Laundry, LaundryService
from app.models.storefront import LaundryStorefront
from app.models.loyalty import Coupon, LoyaltyAccount, ReferralCode
from app.models.notification import Notification
from app.models.order import Order, OrderInventory, OrderItem, OrderStatusEvent
from app.models.order_task_assignment import OrderTaskAssignment
from app.models.pickup_evidence import PickupEvidencePhoto
from app.models.otp_code import OtpCode
from app.models.partner_commission_override import PartnerCommissionOverride
from app.models.partner_staff import PartnerStaff
from app.models.staff_activity_log import StaffActivityLog
from app.models.payment import Payment
from app.models.platform import PlatformSetting
from app.models.profit_sharing import (
    PlatformExpense,
    PlatformOwnershipPartner,
    ProfitShareAllocation,
    ProfitSharePeriod,
)
from app.models.refresh_token import RefreshToken
from app.models.settlement import Settlement, SettlementAdjustment, SettlementOrder
from app.models.subscription import Subscription, SubscriptionPlan
from app.models.user import User
from app.models.user_address import UserAddress

__all__ = [
    "Announcement",
    "AnnouncementEvent",
    "AuditLog",
    "CallbackRequest",
    "Complaint",
    "CustomerQuestion",
    "ComplaintInternalNote",
    "ComplaintPhoto",
    "FraudAlert",
    "CustomerTrustScoreEvent",
    "ComplaintStatusEvent",
    "Coupon",
    "Laundry",
    "LaundryService",
    "DeliveryProofPhoto",
    "OrderCustodyEvent",
    "OrderDeliveryOtp",
    "OrderInventoryChangeRequest",
    "OrderInventoryHistory",
    "OrderInventoryItem",
    "OrderInventoryVerification",
    "LaundryStorefront",
    "LoyaltyAccount",
    "Notification",
    "Order",
    "OrderInventory",
    "OrderItem",
    "OrderStatusEvent",
    "PickupEvidencePhoto",
    "OtpCode",
    "PartnerStaff",
    "StaffActivityLog",
    "Payment",
    "PlatformFacilityTag",
    "ServiceCategory",
    "StorefrontEngagementEvent",
    "PlatformExpense",
    "PlatformOwnershipPartner",
    "ProfitShareAllocation",
    "ProfitSharePeriod",
    "ReferralCode",
    "RefreshToken",
    "Review",
    "Settlement",
    "SettlementAdjustment",
    "SettlementOrder",
    "Subscription",
    "SubscriptionPlan",
    "User",
    "UserAddress",
]
