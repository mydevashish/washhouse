"""Loyalty and referrals."""

from __future__ import annotations

import secrets
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Request

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_user_payload
from app.models.loyalty import LoyaltyAccount, ReferralCode

router = APIRouter(prefix="/loyalty", tags=["loyalty"])


@router.get("/me")
async def loyalty_me(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_user_payload)],
) -> dict:
    user_id = UUID(payload["sub"])
    from sqlalchemy import select

    result = await session.execute(select(LoyaltyAccount).where(LoyaltyAccount.user_id == user_id))
    account = result.scalar_one_or_none()
    if not account:
        account = LoyaltyAccount(user_id=user_id, points_balance=0)
        session.add(account)
        await session.flush()
    ref = await session.execute(select(ReferralCode).where(ReferralCode.user_id == user_id))
    referral = ref.scalar_one_or_none()
    if not referral:
        referral = ReferralCode(user_id=user_id, code=secrets.token_hex(4).upper())
        session.add(referral)
        await session.flush()
    return success_envelope(
        {"points": account.points_balance, "referral_code": referral.code},
        request,
    )
