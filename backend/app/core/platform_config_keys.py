"""Canonical platform configuration keys and defaults."""

from __future__ import annotations

# Commission (default_commission_rate lives in PlatformSetting.default_commission_key())
ORDER_MIN_AMOUNT_INR = "order_min_amount_inr"
ORDER_MAX_AMOUNT_INR = "order_max_amount_inr"
PICKUP_RADIUS_KM = "pickup_radius_km"
DELIVERY_RADIUS_KM = "delivery_radius_km"
DISPUTE_WINDOW_HOURS = "dispute_window_hours"
REFUND_WINDOW_HOURS = "refund_window_hours"
DISPUTE_SLA_HOURS = "dispute_sla_hours"
SESSION_IDLE_TIMEOUT_MINUTES = "session_idle_timeout_minutes"
SESSION_WARNING_TIMEOUT_MINUTES = "session_warning_timeout_minutes"
NOTIFY_EMAIL_ENABLED = "notify_email_enabled"
NOTIFY_SMS_ENABLED = "notify_sms_enabled"
NOTIFY_PUSH_ENABLED = "notify_push_enabled"
NOTIFY_IN_APP_ENABLED = "notify_in_app_enabled"

DEFAULT_DISPUTE_SLA_HOURS = '{"low":72,"medium":48,"high":24,"critical":4}'

PLATFORM_CONFIG_DEFAULTS: dict[str, str] = {
    ORDER_MIN_AMOUNT_INR: "99",
    ORDER_MAX_AMOUNT_INR: "50000",
    PICKUP_RADIUS_KM: "5",
    DELIVERY_RADIUS_KM: "8",
    DISPUTE_WINDOW_HOURS: "48",
    REFUND_WINDOW_HOURS: "48",
    DISPUTE_SLA_HOURS: DEFAULT_DISPUTE_SLA_HOURS,
    SESSION_IDLE_TIMEOUT_MINUTES: "30",
    SESSION_WARNING_TIMEOUT_MINUTES: "5",
    NOTIFY_EMAIL_ENABLED: "true",
    NOTIFY_SMS_ENABLED: "true",
    NOTIFY_PUSH_ENABLED: "true",
    NOTIFY_IN_APP_ENABLED: "true",
}

CONFIG_CATEGORIES = {
    "commission": ["default_commission_rate"],
    "order": [ORDER_MIN_AMOUNT_INR, ORDER_MAX_AMOUNT_INR, PICKUP_RADIUS_KM, DELIVERY_RADIUS_KM],
    "dispute": [DISPUTE_WINDOW_HOURS, REFUND_WINDOW_HOURS, DISPUTE_SLA_HOURS],
    "session": [SESSION_IDLE_TIMEOUT_MINUTES, SESSION_WARNING_TIMEOUT_MINUTES],
    "notification": [
        NOTIFY_EMAIL_ENABLED,
        NOTIFY_SMS_ENABLED,
        NOTIFY_PUSH_ENABLED,
        NOTIFY_IN_APP_ENABLED,
    ],
}
