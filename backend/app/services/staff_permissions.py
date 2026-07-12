"""Staff role → permission mapping."""

from __future__ import annotations

from app.models.enums import PartnerStaffRole

# Permission keys used across partner portal
PERM_STAFF_MANAGE = "staff:manage"
PERM_STAFF_VIEW = "staff:view"
PERM_ORDERS_ALL = "orders:all"
PERM_ORDERS_VIEW = "orders:view"
PERM_PICKUPS = "pickups:manage"
PERM_DELIVERIES = "deliveries:manage"
PERM_PROCESSING = "processing:manage"
PERM_ANALYTICS = "analytics:view"
PERM_CUSTOMERS = "customers:view"

ROLE_PERMISSIONS: dict[PartnerStaffRole, frozenset[str]] = {
    PartnerStaffRole.owner: frozenset(
        {
            PERM_STAFF_MANAGE,
            PERM_STAFF_VIEW,
            PERM_ORDERS_ALL,
            PERM_ORDERS_VIEW,
            PERM_PICKUPS,
            PERM_DELIVERIES,
            PERM_PROCESSING,
            PERM_ANALYTICS,
            PERM_CUSTOMERS,
        },
    ),
    PartnerStaffRole.manager: frozenset(
        {
            PERM_STAFF_VIEW,
            PERM_ORDERS_ALL,
            PERM_ORDERS_VIEW,
            PERM_PICKUPS,
            PERM_DELIVERIES,
            PERM_PROCESSING,
            PERM_ANALYTICS,
            PERM_CUSTOMERS,
        },
    ),
    PartnerStaffRole.pickup_agent: frozenset({PERM_PICKUPS, PERM_ORDERS_VIEW}),
    PartnerStaffRole.delivery_agent: frozenset({PERM_DELIVERIES, PERM_ORDERS_VIEW}),
    PartnerStaffRole.operator: frozenset({PERM_PROCESSING, PERM_ORDERS_VIEW}),
    PartnerStaffRole.support_staff: frozenset({PERM_ORDERS_VIEW, PERM_CUSTOMERS}),
    # Legacy role mappings
    PartnerStaffRole.pickup_only: frozenset({PERM_PICKUPS, PERM_ORDERS_VIEW}),
    PartnerStaffRole.delivery_only: frozenset({PERM_DELIVERIES, PERM_ORDERS_VIEW}),
    PartnerStaffRole.inventory: frozenset({PERM_PROCESSING, PERM_ORDERS_VIEW}),
    PartnerStaffRole.full_access: frozenset(
        {
            PERM_STAFF_VIEW,
            PERM_ORDERS_ALL,
            PERM_ORDERS_VIEW,
            PERM_PICKUPS,
            PERM_DELIVERIES,
            PERM_PROCESSING,
            PERM_ANALYTICS,
            PERM_CUSTOMERS,
        },
    ),
}

ROLE_LABELS: dict[str, str] = {
    "owner": "Owner",
    "manager": "Manager",
    "pickup_agent": "Pickup Agent",
    "delivery_agent": "Delivery Agent",
    "operator": "Laundry Operator",
    "support_staff": "Support Staff",
    "pickup_only": "Pickup Agent",
    "delivery_only": "Delivery Agent",
    "inventory": "Laundry Operator",
    "full_access": "Manager",
}


def normalize_role(role: PartnerStaffRole) -> PartnerStaffRole:
    legacy_map = {
        PartnerStaffRole.pickup_only: PartnerStaffRole.pickup_agent,
        PartnerStaffRole.delivery_only: PartnerStaffRole.delivery_agent,
        PartnerStaffRole.inventory: PartnerStaffRole.operator,
        PartnerStaffRole.full_access: PartnerStaffRole.manager,
    }
    return legacy_map.get(role, role)


def role_permissions(role: PartnerStaffRole) -> frozenset[str]:
    return ROLE_PERMISSIONS.get(role, frozenset())


def has_permission(role: PartnerStaffRole, permission: str) -> bool:
    return permission in role_permissions(role)
