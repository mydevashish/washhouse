import {
  normalizePartnerTagsSearchQuery,
  partnerTagsOrderSearchListParams,
  shouldRunPartnerTagsSearch,
} from './partner-tags-order-search';

describe('normalizePartnerTagsSearchQuery', () => {
  it('trims whitespace', () => {
    expect(normalizePartnerTagsSearchQuery('  WH-123  ')).toBe('WH-123');
    expect(normalizePartnerTagsSearchQuery('\t98765\n')).toBe('98765');
  });
});

describe('shouldRunPartnerTagsSearch', () => {
  it('requires at least 3 characters for generic queries', () => {
    expect(shouldRunPartnerTagsSearch('')).toBe(false);
    expect(shouldRunPartnerTagsSearch('ab')).toBe(false);
    expect(shouldRunPartnerTagsSearch('abc')).toBe(true);
    expect(shouldRunPartnerTagsSearch('9876')).toBe(true);
  });

  it('runs for tracking prefix WH- even when short', () => {
    expect(shouldRunPartnerTagsSearch('WH-')).toBe(true);
    expect(shouldRunPartnerTagsSearch('wh-1')).toBe(true);
  });

  it('runs for token prefix R- even when short', () => {
    expect(shouldRunPartnerTagsSearch('R-')).toBe(true);
    expect(shouldRunPartnerTagsSearch('r-4')).toBe(true);
  });
});

describe('partnerTagsOrderSearchListParams', () => {
  it('maps to server search over all orders with page size 10', () => {
    expect(partnerTagsOrderSearchListParams('  R-42  ')).toEqual({
      search: 'R-42',
      bucket: 'all',
      page: 1,
      page_size: 10,
      sort_by: 'created_at',
      sort_order: 'desc',
    });
  });
});
