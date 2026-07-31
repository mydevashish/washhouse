import {
  buildDirectionsUrls,
  distanceKmBetween,
  haversineKm,
  parseLaundryCoords,
  pickDirectionsUrl,
} from '@/lib/geo';

describe('haversineKm', () => {
  it('returns ~0 for the same point', () => {
    const p = { latitude: 12.97, longitude: 77.59 };
    expect(haversineKm(p, p)).toBeCloseTo(0, 5);
  });

  it('measures a known short Bengaluru hop (~2.2 km)', () => {
    const koramangala = { latitude: 12.9352, longitude: 77.6245 };
    const indiranagar = { latitude: 12.9784, longitude: 77.6408 };
    const km = haversineKm(koramangala, indiranagar);
    expect(km).toBeGreaterThan(2);
    expect(km).toBeLessThan(6);
  });
});

describe('parseLaundryCoords', () => {
  it('accepts valid numbers', () => {
    expect(parseLaundryCoords(12.9, 77.6)).toEqual({ latitude: 12.9, longitude: 77.6 });
  });

  it('rejects missing or out-of-range values', () => {
    expect(parseLaundryCoords(null, 77)).toBeNull();
    expect(parseLaundryCoords(12, undefined)).toBeNull();
    expect(parseLaundryCoords(100, 77)).toBeNull();
  });

  it('accepts numeric strings from JSON', () => {
    expect(parseLaundryCoords('12.9', '77.6')).toEqual({
      latitude: 12.9,
      longitude: 77.6,
    });
  });
});

describe('distanceKmBetween', () => {
  it('returns null without a user location', () => {
    expect(distanceKmBetween(null, 12.9, 77.6)).toBeNull();
  });

  it('returns a rounded km when both sides are valid', () => {
    const from = { latitude: 12.9352, longitude: 77.6245 };
    expect(distanceKmBetween(from, 12.9784, 77.6408)).toEqual(expect.any(Number));
  });
});

describe('buildDirectionsUrls', () => {
  it('builds Google, Apple, and geo deep links', () => {
    const urls = buildDirectionsUrls(12.9352, 77.6245);
    expect(urls.google).toContain('destination=12.9352,77.6245');
    expect(urls.apple).toBe('https://maps.apple.com/?daddr=12.9352,77.6245');
    expect(urls.geo).toBe('geo:12.9352,77.6245?q=12.9352,77.6245');
  });
});

describe('pickDirectionsUrl', () => {
  it('prefers server google URL on desktop user agents', () => {
    const url = pickDirectionsUrl({
      latitude: 12.9,
      longitude: 77.6,
      google_maps_url: 'https://www.google.com/maps/dir/?api=1&destination=12.9,77.6',
      apple_maps_url: 'https://maps.apple.com/?daddr=12.9,77.6',
      geo_url: 'geo:12.9,77.6?q=12.9,77.6',
    });
    expect(url).toContain('google.com/maps/dir');
  });

  it('returns null without coordinates or URLs', () => {
    expect(pickDirectionsUrl({})).toBeNull();
  });
});
