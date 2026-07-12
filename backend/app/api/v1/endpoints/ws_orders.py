"""WebSocket endpoint for live order tracking."""

from __future__ import annotations

import asyncio
import json
from typing import Any
from uuid import UUID

import structlog
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from sqlalchemy import select

from app.core.config import settings
from app.core.exceptions import AuthenticationError, TokenExpiredError
from app.core.redis_client import get_redis
from app.core.security import decode_token
from app.db.session import AsyncSessionLocal
from app.models.order import Order
from app.services.order_events import order_events_channel

log = structlog.get_logger(__name__)

router = APIRouter(tags=["websocket"])

_WS_CLOSE_UNAUTHORIZED = 4401
_WS_CLOSE_FORBIDDEN = 4403
_WS_CLOSE_NOT_FOUND = 4404


def _authenticate_ws_token(token: str | None) -> dict[str, Any]:
    if not token:
        raise AuthenticationError("Missing token")
    payload = decode_token(token, validate_session=True)
    if payload.get("typ") != "access":
        raise AuthenticationError("Wrong token type")
    return payload


async def _user_owns_order(user_id: UUID, order_id: UUID) -> Order | None:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Order).where(
                Order.id == order_id,
                Order.user_id == user_id,
                Order.deleted_at.is_(None),
            ),
        )
        return result.scalar_one_or_none()


async def _redis_forwarder(pubsub: Any, websocket: WebSocket) -> None:
    try:
        async for message in pubsub.listen():
            if message.get("type") != "message":
                continue
            data = message.get("data")
            if data is None:
                continue
            await websocket.send_text(data if isinstance(data, str) else data.decode())
    except asyncio.CancelledError:
        raise
    except WebSocketDisconnect:
        raise
    except Exception as exc:
        log.debug("order_ws.forwarder_stopped", error=str(exc))


async def _client_loop(websocket: WebSocket) -> None:
    while True:
        raw = await websocket.receive_text()
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            await websocket.send_text(json.dumps({"type": "error", "message": "invalid_json"}))
            continue

        msg_type = payload.get("type")
        if msg_type == "ping":
            await websocket.send_text(json.dumps({"type": "pong"}))
        elif msg_type == "pong":
            continue
        else:
            await websocket.send_text(
                json.dumps({"type": "error", "message": "unknown_message_type"}),
            )


@router.websocket("/ws/orders/{order_id}")
async def order_tracking_websocket(
    websocket: WebSocket,
    order_id: UUID,
    token: str | None = Query(default=None),
) -> None:
    if not settings.ORDER_WS_ENABLED:
        await websocket.close(code=1013, reason="WebSocket disabled")
        return

    try:
        payload = _authenticate_ws_token(token)
    except (AuthenticationError, TokenExpiredError):
        await websocket.close(code=_WS_CLOSE_UNAUTHORIZED, reason="Unauthorized")
        return

    user_id = UUID(payload["sub"])
    order = await _user_owns_order(user_id, order_id)
    if order is None:
        await websocket.close(code=_WS_CLOSE_NOT_FOUND, reason="Order not found")
        return

    await websocket.accept()

    status = order.status.value if hasattr(order.status, "value") else str(order.status)
    await websocket.send_text(
        json.dumps(
            {
                "type": "connected",
                "order_id": str(order.id),
                "status": status,
            },
        ),
    )

    redis = get_redis()
    pubsub = redis.pubsub()
    channel = order_events_channel(order_id)
    await pubsub.subscribe(channel)

    forwarder = asyncio.create_task(_redis_forwarder(pubsub, websocket))
    client_task = asyncio.create_task(_client_loop(websocket))

    try:
        done, _ = await asyncio.wait(
            {forwarder, client_task},
            return_when=asyncio.FIRST_COMPLETED,
        )
        for task in done:
            if exc := task.exception():
                if not isinstance(exc, WebSocketDisconnect):
                    log.debug("order_ws.task_error", error=str(exc))
    except WebSocketDisconnect:
        pass
    finally:
        forwarder.cancel()
        client_task.cancel()
        await asyncio.gather(forwarder, client_task, return_exceptions=True)
        await pubsub.unsubscribe(channel)
        await pubsub.aclose()
