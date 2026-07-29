/** Earth mean radius (km) — matches backend `app.core.geo` (meters / 1000). */
const EARTH_RADIUS_KM = 6_371;

export type GeoPoint = {
  latitude: number;
  longitude: number;
};

export type DirectionsUrls = {
  google: string;
  apple: string;
  geo: string;
};

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Great-circle distance in kilometres (haversine). */
export function haversineKm(
  a: GeoPoint,
  b: GeoPoint,
): number {
  const phi1 = toRadians(a.latitude);
  const phi2 = toRadians(b.latitude);
  const dPhi = toRadians(b.latitude - a.latitude);
  const dLambda = toRadians(b.longitude - a.longitude);
  const h =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Parse optional laundry coords; returns null when either axis is missing/invalid. */
export function parseLaundryCoords(
  latitude: unknown,
  longitude: unknown,
): GeoPoint | null {
  if (latitude == null || longitude == null || latitude === '' || longitude === '') {
    return null;
  }
  const lat = typeof latitude === 'number' ? latitude : Number(latitude);
  const lng = typeof longitude === 'number' ? longitude : Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { latitude: lat, longitude: lng };
}

/** Distance in km when both points are valid; otherwise null. */
export function distanceKmBetween(
  from: GeoPoint | null | undefined,
  toLat: unknown,
  toLng: unknown,
): number | null {
  if (!from) return null;
  const to = parseLaundryCoords(toLat, toLng);
  if (!to) return null;
  return Number(haversineKm(from, to).toFixed(1));
}

/** Build Google / Apple / geo deep links for turn-by-turn directions. */
export function buildDirectionsUrls(latitude: number, longitude: number): DirectionsUrls {
  return {
    google: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
    apple: `https://maps.apple.com/?daddr=${latitude},${longitude}`,
    geo: `geo:${latitude},${longitude}?q=${latitude},${longitude}`,
  };
}

/**
 * Prefer Apple Maps on iOS, geo: on Android (OS chooser), Google Maps elsewhere.
 * Prefer server-provided URLs when present.
 */
export function pickDirectionsUrl(opts: {
  latitude?: number | null;
  longitude?: number | null;
  google_maps_url?: string | null;
  apple_maps_url?: string | null;
  geo_url?: string | null;
}): string | null {
  const built =
    opts.latitude != null && opts.longitude != null
      ? buildDirectionsUrls(opts.latitude, opts.longitude)
      : null;
  const google = opts.google_maps_url ?? built?.google ?? null;
  const apple = opts.apple_maps_url ?? built?.apple ?? null;
  const geo = opts.geo_url ?? built?.geo ?? null;
  if (!google && !apple && !geo) return null;

  if (typeof navigator === 'undefined') return google ?? apple ?? geo;

  const ua = navigator.userAgent || '';
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS) return apple ?? google ?? geo;
  if (/Android/i.test(ua)) return geo ?? google ?? apple;
  return google ?? apple ?? geo;
}
