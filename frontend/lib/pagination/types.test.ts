import { ALLOWED_PAGE_SIZES, DEFAULT_PAGE_SIZE, normalizePageSize } from './types';

describe('normalizePageSize', () => {
  it('defaults to 10', () => {
    expect(DEFAULT_PAGE_SIZE).toBe(10);
    expect(normalizePageSize()).toBe(10);
    expect(normalizePageSize(undefined)).toBe(10);
  });

  it('accepts allowed sizes', () => {
    for (const size of ALLOWED_PAGE_SIZES) {
      expect(normalizePageSize(size)).toBe(size);
    }
  });

  it('falls back to 10 for invalid sizes', () => {
    expect(normalizePageSize(15)).toBe(10);
    expect(normalizePageSize(20)).toBe(10);
    expect(normalizePageSize(0)).toBe(10);
    expect(normalizePageSize(200)).toBe(10);
  });
});
