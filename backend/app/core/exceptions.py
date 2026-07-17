"""Domain exception hierarchy.

API endpoints should not raise HTTPException with arbitrary messages.
Raise these domain exceptions; the global handler maps them to HTTP.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class ErrorDetail:
    field: str
    issue: str


class DomainError(Exception):
    code: str = "INTERNAL_ERROR"
    status_code: int = 500
    message: str = "An unexpected error occurred"

    def __init__(
        self,
        message: str | None = None,
        details: list[ErrorDetail] | None = None,
    ) -> None:
        self.message = message or self.message
        self.details = details or []
        super().__init__(self.message)


# ---------- Generic shapes ----------
class NotFoundError(DomainError):
    code = "NOT_FOUND"
    status_code = 404
    message = "Resource not found"


class ValidationError(DomainError):
    code = "VALIDATION_FAILED"
    status_code = 422
    message = "Validation failed"


class AuthenticationError(DomainError):
    code = "AUTH_FAILED"
    status_code = 401
    message = "Authentication required"


class AuthorizationError(DomainError):
    code = "FORBIDDEN"
    status_code = 403
    message = "You do not have permission to perform this action"


class ConflictError(DomainError):
    code = "CONFLICT"
    status_code = 409
    message = "Conflict"


class RateLimitError(DomainError):
    code = "RATE_LIMITED"
    status_code = 429
    message = "Too many requests"


# ---------- Auth ----------
class InvalidCredentialsError(AuthenticationError):
    code = "AUTH_INVALID_CREDENTIALS"
    message = "Invalid email or password"


class TokenExpiredError(AuthenticationError):
    code = "AUTH_TOKEN_EXPIRED"
    message = "Token expired"


class TokenReuseError(AuthenticationError):
    code = "AUTH_TOKEN_REUSE"
    message = "Refresh token reuse detected"


class SessionInvalidatedError(AuthenticationError):
    code = "AUTH_SESSION_INVALIDATED"
    message = "System updated. Please login again."


# ---------- Users ----------
class UserNotFoundError(NotFoundError):
    code = "USER_NOT_FOUND"
    message = "User not found"


class EmailAlreadyRegisteredError(ConflictError):
    code = "USER_EMAIL_TAKEN"
    message = "Email already registered"


# ---------- Laundries ----------
class LaundryNotFoundError(NotFoundError):
    code = "LAUNDRY_NOT_FOUND"
    message = "Laundry not found"


class LaundryNotApprovedError(ConflictError):
    code = "LAUNDRY_NOT_APPROVED"
    message = "Laundry not yet approved"


# ---------- Orders ----------
class OrderNotFoundError(NotFoundError):
    code = "ORDER_NOT_FOUND"
    message = "Order not found"


class OrderInvalidTransitionError(ConflictError):
    code = "ORDER_INVALID_TRANSITION"
    message = "Cannot transition order to the requested status"


class OrderCancellationWindowClosedError(ConflictError):
    code = "ORDER_CANCEL_WINDOW_CLOSED"
    message = "Cancellation window has closed"


# ---------- Payments ----------
class PaymentDeclinedError(ConflictError):
    code = "PAYMENT_DECLINED"
    message = "Payment was declined"


# ---------- Email ----------
class EmailNotConfiguredError(DomainError):
    code = "EMAIL_NOT_CONFIGURED"
    status_code = 503
    message = (
        "Email delivery is not configured. Set SMTP_HOST, SMTP_PORT, "
        "SMTP_USERNAME, SMTP_PASSWORD, and SMTP_FROM_EMAIL."
    )


class EmailDeliveryError(DomainError):
    code = "EMAIL_DELIVERY_FAILED"
    status_code = 502
    message = "Failed to send email. Check SMTP settings and try again."
