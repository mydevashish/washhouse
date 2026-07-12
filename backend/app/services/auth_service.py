"""Authentication business logic."""

from __future__ import annotations

import secrets
from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import (
    EmailAlreadyRegisteredError,
    InvalidCredentialsError,
    TokenReuseError,
    ValidationError,
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.enums import AuditAction, OtpPurpose
from app.models.user import User
from app.repositories.audit import AuditRepository
from app.repositories.otp import OtpRepository
from app.repositories.refresh_token import RefreshTokenRepository
from app.repositories.user import UserRepository
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    OtpSendRequest,
    OtpVerifyRequest,
    PasswordForgotRequest,
    PasswordResetRequest,
    RegisterRequest,
    TokenPairResponse,
)
from app.services.notifications.sms import send_sms
from app.services.notifications.whatsapp import get_whatsapp_provider
from app.schemas.user import UserResponse


class AuthService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._users = UserRepository(session)
        self._refresh = RefreshTokenRepository(session)
        self._otp = OtpRepository(session)
        self._audit = AuditRepository(session)

    async def register(
        self,
        payload: RegisterRequest,
        *,
        ip: str | None = None,
        user_agent: str | None = None,
    ) -> AuthResponse:
        if await self._users.get_by_email(payload.email):
            raise EmailAlreadyRegisteredError()

        user = await self._users.create(
            email=payload.email,
            phone=None,
            password_hash=hash_password(payload.password),
            full_name=payload.full_name,
        )
        await self._audit.log(
            action=AuditAction.user_register,
            actor_user_id=user.id,
            resource_type="user",
            resource_id=str(user.id),
            ip_address=ip,
            user_agent=user_agent,
        )
        tokens, _ = await self._issue_tokens(user)
        return AuthResponse(user=UserResponse.model_validate(user), tokens=tokens)

    async def login(
        self,
        payload: LoginRequest,
        *,
        ip: str | None = None,
        user_agent: str | None = None,
    ) -> AuthResponse:
        user = await self._users.get_by_email(payload.email)
        if (
            not user
            or not user.password_hash
            or not verify_password(
                payload.password,
                user.password_hash,
            )
        ):
            raise InvalidCredentialsError()

        from app.models.enums import UserRole
        from app.repositories.staff_management import StaffManagementRepository

        if user.role == UserRole.partner_staff:
            staff = await StaffManagementRepository(self._session).get_staff_by_user(user.id)
            if not staff or not staff.is_active:
                raise InvalidCredentialsError()
            if staff.is_suspended:
                raise InvalidCredentialsError("Account suspended. Contact your manager.")

        await self._audit.log(
            action=AuditAction.user_login,
            actor_user_id=user.id,
            ip_address=ip,
            user_agent=user_agent,
        )
        from app.services.staff_management_service import StaffManagementService
        await StaffManagementService(self._session).record_login(user.id)
        tokens, _ = await self._issue_tokens(user)
        return AuthResponse(user=UserResponse.model_validate(user), tokens=tokens)

    async def send_otp(self, payload: OtpSendRequest) -> str | None:
        code = f"{secrets.randbelow(1_000_000):06d}"
        code_hash = hash_password(code)
        expires = datetime.now(UTC) + timedelta(minutes=10)
        await self._otp.create(
            phone=payload.phone,
            code_hash=code_hash,
            purpose=OtpPurpose.login,
            expires_at=expires,
        )
        whatsapp = get_whatsapp_provider()
        try:
            await whatsapp.send_otp(payload.phone, code)
        except Exception:
            await send_sms(payload.phone, f"Your DLM login code is {code}")
        if settings.OTP_DEBUG:
            return code
        return None

    async def forgot_password(self, payload: PasswordForgotRequest) -> str | None:
        user = await self._users.get_by_email(payload.email)
        if not user:
            return None
        code = f"{secrets.randbelow(1_000_000):06d}"
        code_hash = hash_password(code)
        expires = datetime.now(UTC) + timedelta(minutes=15)
        await self._otp.create(
            phone=user.phone or "email",
            code_hash=code_hash,
            purpose=OtpPurpose.password_reset,
            expires_at=expires,
            user_id=user.id,
        )
        if settings.OTP_DEBUG:
            return code
        return None

    async def reset_password(self, payload: PasswordResetRequest) -> None:
        user = await self._users.get_by_email(payload.email)
        if not user:
            raise ValidationError("Invalid reset request")
        otp = await self._otp.get_latest_valid_for_user(user.id, OtpPurpose.password_reset)
        if not otp or not verify_password(payload.code, otp.code_hash):
            raise InvalidCredentialsError("Invalid or expired reset code")
        await self._otp.consume(otp)
        user.password_hash = hash_password(payload.new_password)
        await self._users.update(user)
        await self._refresh.revoke_all_for_user(user.id)

    async def verify_otp(
        self,
        payload: OtpVerifyRequest,
        *,
        ip: str | None = None,
        user_agent: str | None = None,
    ) -> AuthResponse:
        otp = await self._otp.get_latest_valid(payload.phone, OtpPurpose.login)
        if not otp:
            raise ValidationError("OTP expired or not found")

        if otp.attempts >= 5:
            raise ValidationError("Too many OTP attempts")

        if not verify_password(payload.code, otp.code_hash):
            await self._otp.increment_attempts(otp)
            raise InvalidCredentialsError("Invalid OTP")

        await self._otp.consume(otp)
        user = await self._users.get_by_phone(payload.phone)
        if not user:
            user = await self._users.create(
                email=None,
                phone=payload.phone,
                password_hash=None,
                full_name=payload.full_name or "Customer",
                is_phone_verified=True,
            )
        else:
            user.is_phone_verified = True
            await self._users.update(user)

        await self._audit.log(
            action=AuditAction.user_login,
            actor_user_id=user.id,
            ip_address=ip,
            user_agent=user_agent,
            metadata={"method": "otp"},
        )
        tokens, _ = await self._issue_tokens(user)
        return AuthResponse(user=UserResponse.model_validate(user), tokens=tokens)

    async def refresh(self, refresh_token: str) -> TokenPairResponse:
        payload = decode_token(refresh_token)
        if payload.get("typ") != "refresh":
            raise InvalidCredentialsError("Invalid refresh token")

        jti = payload.get("jti")
        sub = payload.get("sub")
        if not jti or not sub:
            raise InvalidCredentialsError("Invalid refresh token")

        stored = await self._refresh.get_by_jti(jti)
        if not stored:
            raise InvalidCredentialsError("Invalid refresh token")

        if stored.used_at is not None:
            await self._refresh.revoke_family(stored.family_id)
            raise TokenReuseError()

        if stored.revoked_at is not None or stored.expires_at <= datetime.now(UTC):
            raise InvalidCredentialsError("Refresh token expired")

        user = await self._users.get_by_id(UUID(sub))
        if not user:
            raise InvalidCredentialsError("User not found")

        await self._refresh.mark_used(stored)
        tokens, _ = await self._issue_tokens(user, family_id=stored.family_id)
        return tokens

    async def logout(self, refresh_token: str, *, user_id: UUID | None = None) -> None:
        try:
            payload = decode_token(refresh_token)
            jti = payload.get("jti")
            if jti:
                stored = await self._refresh.get_by_jti(jti)
                if stored:
                    await self._refresh.revoke_family(stored.family_id)
        except Exception:
            pass
        await self._audit.log(
            action=AuditAction.user_logout,
            actor_user_id=user_id,
        )
        if user_id:
            from app.services.staff_management_service import StaffManagementService
            await StaffManagementService(self._session).record_logout(user_id)

    async def _issue_tokens(
        self,
        user: User,
        *,
        family_id: UUID | None = None,
    ) -> tuple[TokenPairResponse, str]:
        access = create_access_token(subject=str(user.id), role=user.role.value)
        refresh = create_refresh_token(subject=str(user.id))
        refresh_payload = decode_token(refresh)
        jti = refresh_payload["jti"]
        exp = datetime.fromtimestamp(refresh_payload["exp"], tz=UTC)

        await self._refresh.create(
            user_id=user.id,
            jti=jti,
            expires_at=exp,
            family_id=family_id,
        )
        return (
            TokenPairResponse(
                access_token=access,
                refresh_token=refresh,
                expires_in=settings.ACCESS_TOKEN_TTL_MIN * 60,
            ),
            refresh,
        )
