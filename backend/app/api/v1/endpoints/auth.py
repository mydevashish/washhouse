"""Authentication endpoints."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_user_payload
from app.core.config import settings
from app.schemas.auth import (
    LoginRequest,
    OtpSendRequest,
    OtpVerifyRequest,
    PasswordForgotRequest,
    PasswordResetRequest,
    RefreshRequest,
    RegisterRequest,
)
from app.core.exceptions import (
    InvalidCredentialsError,
    SessionInvalidatedError,
    TokenExpiredError,
    TokenReuseError,
)
from app.core.server_session import get_server_instance_id
from app.services.auth_service import AuthService
from app.utils.auth_cookies import REFRESH_COOKIE, clear_refresh_cookie, set_refresh_cookie
from app.utils.request_meta import client_ip, user_agent

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/session-info")
async def session_info(request: Request) -> dict:
    """Public boot identity — clients compare after restart."""
    return success_envelope(
        {
            "server_instance_id": get_server_instance_id(),
            "force_logout_on_restart": settings.FORCE_LOGOUT_ON_RESTART,
        },
        request,
    )


def _apply_auth_cookies(response: Response, refresh_token: str | None) -> None:
    if refresh_token:
        set_refresh_cookie(response, refresh_token)


def _strip_refresh_from_body(data: dict) -> dict:
    """Refresh travels in httpOnly cookie; omit from JSON body."""
    if isinstance(data.get("tokens"), dict):
        data["tokens"] = {**data["tokens"], "refresh_token": None}
    return data


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    request: Request,
    response: Response,
    session: SessionDep,
) -> dict:
    result = await AuthService(session).register(
        payload,
        ip=client_ip(request),
        user_agent=user_agent(request),
    )
    _apply_auth_cookies(response, result.tokens.refresh_token)
    body = result.model_dump()
    return success_envelope(_strip_refresh_from_body(body), request)


@router.post("/login")
async def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    session: SessionDep,
) -> dict:
    result = await AuthService(session).login(
        payload,
        ip=client_ip(request),
        user_agent=user_agent(request),
    )
    _apply_auth_cookies(response, result.tokens.refresh_token)
    body = result.model_dump()
    return success_envelope(_strip_refresh_from_body(body), request)


@router.post("/otp/send")
async def otp_send(
    payload: OtpSendRequest,
    request: Request,
    session: SessionDep,
) -> dict:
    debug_code = await AuthService(session).send_otp(payload)
    body: dict = {"message": "OTP sent"}
    if debug_code:
        body["otp_debug"] = debug_code
    return success_envelope(body, request)


@router.post("/otp/verify")
async def otp_verify(
    payload: OtpVerifyRequest,
    request: Request,
    response: Response,
    session: SessionDep,
) -> dict:
    result = await AuthService(session).verify_otp(
        payload,
        ip=client_ip(request),
        user_agent=user_agent(request),
    )
    _apply_auth_cookies(response, result.tokens.refresh_token)
    body = result.model_dump()
    return success_envelope(_strip_refresh_from_body(body), request)


@router.post("/refresh")
async def refresh(
    request: Request,
    response: Response,
    session: SessionDep,
    payload: RefreshRequest | None = None,
) -> dict:
    token = None
    if payload and payload.refresh_token:
        token = payload.refresh_token
    else:
        token = request.cookies.get(REFRESH_COOKIE)
    if not token:
        clear_refresh_cookie(response)
        raise HTTPException(status_code=401, detail="Missing refresh token")
    try:
        tokens = await AuthService(session).refresh(token)
    except (
        InvalidCredentialsError,
        TokenExpiredError,
        TokenReuseError,
        SessionInvalidatedError,
    ):
        clear_refresh_cookie(response)
        raise
    _apply_auth_cookies(response, tokens.refresh_token)
    body = tokens.model_dump()
    body["refresh_token"] = None
    return success_envelope(body, request)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def logout(
    request: Request,
    response: Response,
    session: SessionDep,
    token_payload: Annotated[dict, Depends(get_current_user_payload)],
) -> Response:
    token = request.cookies.get(REFRESH_COOKIE)
    if token:
        user_id = UUID(token_payload["sub"])
        await AuthService(session).logout(token, user_id=user_id)
    clear_refresh_cookie(response)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.post("/password/forgot")
async def password_forgot(
    payload: PasswordForgotRequest,
    request: Request,
    session: SessionDep,
) -> dict:
    debug_code = await AuthService(session).forgot_password(payload)
    body: dict = {"message": "If the email exists, a reset code was sent"}
    if debug_code:
        body["otp_debug"] = debug_code
    return success_envelope(body, request)


@router.post("/password/reset")
async def password_reset(
    payload: PasswordResetRequest,
    request: Request,
    session: SessionDep,
) -> dict:
    await AuthService(session).reset_password(payload)
    return success_envelope({"message": "Password updated"}, request)


@router.get("/google")
async def google_oauth_start(request: Request) -> dict:
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=501, detail="Google OAuth not configured")
    return success_envelope({"authorize_url": "/api/v1/auth/google/callback"}, request)
