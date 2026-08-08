import {
  buildPartnerOrdersQueuePath,
  chipPresetUrlPatch,
  parsePartnerOrdersHubChip,
  parsePartnerOrdersQueueUrlState,
  resolvePartnerOrdersQueueApiFilters,
} from '@/features/partner/orders-hub/partner-orders-hub-queue';

describe('partner-orders-hub-queue', () => {
  it('falls unknown chips back to all', () => {
    expect(parsePartnerOrdersHubChip('nope')).toBe('all');
    expect(parsePartnerOrdersHubChip(null)).toBe('all');
    expect(parsePartnerOrdersHubChip('walk_in')).toBe('walk_in');
  });

  it('maps shortcut chips to API filters', () => {
    expect(
      resolvePartnerOrdersQueueApiFilters({
        chip: 'needs_action',
        q: '',
        status: '',
        source: '',
        payment: '',
        phone: '',
        customer: '',
      }),
    ).toEqual({
      bucket: 'action',
      status: undefined,
      order_source: undefined,
      payment_status: undefined,
      created_today: undefined,
    });

    expect(
      resolvePartnerOrdersQueueApiFilters({
        chip: 'ready_today',
        q: '',
        status: '',
        source: '',
        payment: '',
        phone: '',
        customer: '',
      }),
    ).toMatchObject({ bucket: 'all', status: 'ready' });

    expect(
      resolvePartnerOrdersQueueApiFilters({
        chip: 'walk_in',
        q: '',
        status: '',
        source: '',
        payment: '',
        phone: '',
        customer: '',
      }),
    ).toMatchObject({ order_source: 'walk_in' });

    expect(
      resolvePartnerOrdersQueueApiFilters({
        chip: 'doorstep',
        q: '',
        status: '',
        source: '',
        payment: '',
        phone: '',
        customer: '',
      }),
    ).toMatchObject({ order_source: 'doorstep' });

    expect(
      resolvePartnerOrdersQueueApiFilters({
        chip: 'unpaid',
        q: '',
        status: '',
        source: '',
        payment: '',
        phone: '',
        customer: '',
      }),
    ).toMatchObject({ payment_status: 'unpaid' });

    expect(
      resolvePartnerOrdersQueueApiFilters({
        chip: 'today',
        q: '',
        status: '',
        source: '',
        payment: '',
        phone: '',
        customer: '',
      }),
    ).toMatchObject({ created_today: true });
  });

  it('lets filter-bar status override needs_action bucket', () => {
    expect(
      resolvePartnerOrdersQueueApiFilters({
        chip: 'needs_action',
        q: '',
        status: 'ready',
        source: '',
        payment: '',
        phone: '',
        customer: '',
      }),
    ).toMatchObject({ bucket: 'all', status: 'ready' });
  });

  it('parses URL state and builds deep-linkable paths', () => {
    const state = parsePartnerOrdersQueueUrlState(
      new URLSearchParams('chip=walk_in&q=3210&status=ready'),
    );
    expect(state).toEqual({
      chip: 'walk_in',
      q: '3210',
      status: 'ready',
      source: '',
      payment: '',
      phone: '',
      customer: '',
    });

    const path = buildPartnerOrdersQueuePath(
      { ...chipPresetUrlPatch('ready_today'), q: 'DLM' },
      new URLSearchParams('phone=%2B9198'),
    );
    expect(path).toContain('/partner/orders?');
    expect(path).toContain('chip=ready_today');
    expect(path).toContain('status=ready');
    expect(path).toContain('q=DLM');
    expect(path).toContain('phone=');
  });

  it('customer-scopes queue when phone is present (q falls back to phone)', () => {
    const state = parsePartnerOrdersQueueUrlState(
      new URLSearchParams('phone=%2B919876543210&customer=Riya'),
    );
    expect(state.phone).toBe('+919876543210');
    expect(state.customer).toBe('Riya');
    expect(state.q).toBe('+919876543210');

    const cleared = buildPartnerOrdersQueuePath(
      { phone: null, customer: null, q: null },
      new URLSearchParams('phone=%2B919876543210&customer=Riya&q=%2B919876543210'),
    );
    expect(cleared).toBe('/partner/orders');
  });
});
