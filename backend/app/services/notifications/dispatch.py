"""Channel dispatch helpers — respect platform notification toggles."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.platform_config_service import PlatformConfigService


async def is_channel_enabled(session: AsyncSession, channel: str) -> bool:
    """Return whether a notification channel is enabled (email, sms, push, in_app)."""
    flags = await PlatformConfigService(session).notifications_enabled()
    return flags.get(channel, True)
