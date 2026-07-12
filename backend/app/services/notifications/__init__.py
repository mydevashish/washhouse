"""Notification delivery channels."""

from app.services.notifications.dispatch import is_channel_enabled

__all__ = ["is_channel_enabled"]
