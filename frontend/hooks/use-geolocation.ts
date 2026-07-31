'use client';

import { useCallback, useRef, useState } from 'react';

import type { GeoPoint } from '@/lib/geo';

export type GeolocationStatus =
  | 'idle'
  | 'pending'
  | 'granted'
  | 'denied'
  | 'unavailable'
  | 'error';

export type UseGeolocationResult = {
  status: GeolocationStatus;
  position: GeoPoint | null;
  errorMessage: string | null;
  /** Request browser geolocation. Safe to call repeatedly. */
  request: () => Promise<GeoPoint | null>;
  /** Clear granted position and return to idle (keep search-by-area). Cancels in-flight. */
  clear: () => void;
};

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 12_000,
  maximumAge: 60_000,
};

function mapError(err: GeolocationPositionError): {
  status: GeolocationStatus;
  message: string;
} {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return {
        status: 'denied',
        message:
          'Location access was denied. Search by area, or enable location in browser settings and try again.',
      };
    case err.POSITION_UNAVAILABLE:
      return {
        status: 'unavailable',
        message: 'Location is unavailable right now. Search by area instead.',
      };
    case err.TIMEOUT:
      return {
        status: 'error',
        message: 'Location request timed out. Try again or search by area.',
      };
    default:
      return {
        status: 'error',
        message: 'Could not get your location. Search by area instead.',
      };
  }
}

/**
 * Browser geolocation for near-me sort. Deny / errors stay graceful —
 * callers keep search-by-area without blocking the directory.
 *
 * `clear()` bumps a generation token so a late getCurrentPosition success
 * cannot re-apply GPS after the user cancels or toggles Near me off.
 */
export function useGeolocation(): UseGeolocationResult {
  const [status, setStatus] = useState<GeolocationStatus>('idle');
  const [position, setPosition] = useState<GeoPoint | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inFlight = useRef<Promise<GeoPoint | null> | null>(null);
  const generation = useRef(0);

  const clear = useCallback(() => {
    generation.current += 1;
    inFlight.current = null;
    setStatus('idle');
    setPosition(null);
    setErrorMessage(null);
  }, []);

  const request = useCallback(async (): Promise<GeoPoint | null> => {
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      setStatus('unavailable');
      setPosition(null);
      setErrorMessage(
        'Location needs a secure connection (HTTPS). Search by area instead.',
      );
      return null;
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unavailable');
      setPosition(null);
      setErrorMessage('Location is not supported in this browser. Search by area instead.');
      return null;
    }

    if (inFlight.current) return inFlight.current;

    const requestId = generation.current + 1;
    generation.current = requestId;
    setStatus('pending');
    setErrorMessage(null);

    const promise = new Promise<GeoPoint | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (generation.current !== requestId) {
            resolve(null);
            return;
          }
          const next: GeoPoint = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setPosition(next);
          setStatus('granted');
          setErrorMessage(null);
          resolve(next);
        },
        (err) => {
          if (generation.current !== requestId) {
            resolve(null);
            return;
          }
          const mapped = mapError(err);
          setStatus(mapped.status);
          setPosition(null);
          setErrorMessage(mapped.message);
          resolve(null);
        },
        GEO_OPTIONS,
      );
    }).finally(() => {
      if (inFlight.current === promise) {
        inFlight.current = null;
      }
    });

    inFlight.current = promise;
    return promise;
  }, []);

  return { status, position, errorMessage, request, clear };
}
