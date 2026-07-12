"""Geo helpers for fraud detection."""

from __future__ import annotations

import math

EARTH_RADIUS_M = 6_371_000
DELIVERY_GPS_TOLERANCE_M = 500


def haversine_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * EARTH_RADIUS_M * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def is_far_from_address(
    address_lat: float | None,
    address_lng: float | None,
    point_lat: float | None,
    point_lng: float | None,
    *,
    tolerance_m: float = DELIVERY_GPS_TOLERANCE_M,
) -> bool:
    if address_lat is None or address_lng is None:
        return False
    if point_lat is None or point_lng is None:
        return True
    return haversine_meters(address_lat, address_lng, point_lat, point_lng) > tolerance_m
