/**
 * @jest-environment jsdom
 */
import { act, renderHook, waitFor } from '@testing-library/react';

import { useGeolocation } from '@/hooks/use-geolocation';
import type { GeoPoint } from '@/lib/geo';

type GeoSuccess = (pos: GeolocationPosition) => void;
type GeoError = (err: GeolocationPositionError) => void;

function mockGeolocation(impl: {
  getCurrentPosition: (
    success: GeoSuccess,
    error: GeoError,
    options?: PositionOptions,
  ) => void;
}) {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: impl,
  });
}

describe('useGeolocation', () => {
  const originalSecure = window.isSecureContext;

  afterEach(() => {
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: originalSecure,
    });
    // @ts-expect-error test cleanup
    delete navigator.geolocation;
  });

  it('grants position on success', async () => {
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: true,
    });
    mockGeolocation({
      getCurrentPosition: (success) => {
        success({
          coords: {
            latitude: 12.9352,
            longitude: 77.6245,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        } as GeolocationPosition);
      },
    });

    const { result } = renderHook(() => useGeolocation());
    let pos: Awaited<ReturnType<typeof result.current.request>> = null;
    await act(async () => {
      pos = await result.current.request();
    });

    expect(pos).toEqual({ latitude: 12.9352, longitude: 77.6245 });
    await waitFor(() => expect(result.current.status).toBe('granted'));
    expect(result.current.position).toEqual({ latitude: 12.9352, longitude: 77.6245 });
    expect(result.current.errorMessage).toBeNull();
  });

  it('maps permission denied without hanging on pending', async () => {
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: true,
    });
    mockGeolocation({
      getCurrentPosition: (_success, error) => {
        error({
          code: 1,
          message: 'denied',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        } as GeolocationPositionError);
      },
    });

    const { result } = renderHook(() => useGeolocation());
    await act(async () => {
      await result.current.request();
    });

    expect(result.current.status).toBe('denied');
    expect(result.current.position).toBeNull();
    expect(result.current.errorMessage).toMatch(/denied/i);
    expect(result.current.errorMessage).toMatch(/browser settings/i);
  });

  it('fails fast on insecure context', async () => {
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: false,
    });
    mockGeolocation({
      getCurrentPosition: () => {
        throw new Error('should not call geolocation');
      },
    });

    const { result } = renderHook(() => useGeolocation());
    await act(async () => {
      await result.current.request();
    });

    expect(result.current.status).toBe('unavailable');
    expect(result.current.errorMessage).toMatch(/secure connection/i);
  });

  it('maps timeout without hanging on pending', async () => {
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: true,
    });
    mockGeolocation({
      getCurrentPosition: (_success, error) => {
        error({
          code: 3,
          message: 'timeout',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        } as GeolocationPositionError);
      },
    });

    const { result } = renderHook(() => useGeolocation());
    await act(async () => {
      await result.current.request();
    });

    expect(result.current.status).toBe('error');
    expect(result.current.position).toBeNull();
    expect(result.current.errorMessage).toMatch(/timed out/i);
  });

  it('clear restores idle and drops position', async () => {
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: true,
    });
    mockGeolocation({
      getCurrentPosition: (success) => {
        success({
          coords: {
            latitude: 1,
            longitude: 2,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        } as GeolocationPosition);
      },
    });

    const { result } = renderHook(() => useGeolocation());
    await act(async () => {
      await result.current.request();
    });
    act(() => {
      result.current.clear();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.position).toBeNull();
    expect(result.current.errorMessage).toBeNull();
  });

  it('clear during pending ignores a late GPS success', async () => {
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: true,
    });

    let lateSuccess: GeoSuccess | null = null;
    mockGeolocation({
      getCurrentPosition: (success) => {
        lateSuccess = success;
      },
    });

    const { result } = renderHook(() => useGeolocation());
    let resolved: GeoPoint | null | undefined = undefined;

    let pending!: Promise<void>;
    act(() => {
      pending = result.current.request().then((pos) => {
        resolved = pos;
      });
    });

    await waitFor(() => expect(result.current.status).toBe('pending'));

    act(() => {
      result.current.clear();
    });

    expect(result.current.status).toBe('idle');

    await act(async () => {
      lateSuccess?.({
        coords: {
          latitude: 12.9,
          longitude: 77.6,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      } as GeolocationPosition);
      await pending;
    });

    expect(resolved).toBeNull();
    expect(result.current.status).toBe('idle');
    expect(result.current.position).toBeNull();
  });
});
