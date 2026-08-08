import {
  countFloorOrders,
  filterFloorOrders,
  getFloorAdvancePlan,
  phoneLast4,
  pieceCount,
  toFloorStatus,
} from '@/features/partner-shop-floor/lib/floor-status';

describe('floor-status mapping', () => {
  it('maps walk-in statuses to simplified labels', () => {
    expect(toFloorStatus('confirmed', 'walk_in')).toBe('received');
    expect(toFloorStatus('washing', 'walk_in')).toBe('washing');
    expect(toFloorStatus('ready', 'walk_in')).toBe('ready');
    expect(toFloorStatus('delivered', 'walk_in')).toBe('given');
    expect(toFloorStatus('cancelled', 'walk_in')).toBeNull();
  });

  it('maps doorstep statuses to simplified labels', () => {
    expect(toFloorStatus('confirmed', 'online')).toBe('received');
    expect(toFloorStatus('pickup_assigned', 'online')).toBe('received');
    expect(toFloorStatus('picked_up', 'online')).toBe('received');
    expect(toFloorStatus('washing', 'online')).toBe('washing');
    expect(toFloorStatus('ironing', 'online')).toBe('washing');
    expect(toFloorStatus('ready', 'online')).toBe('ready');
    expect(toFloorStatus('out_for_delivery', 'online')).toBe('given');
    expect(toFloorStatus('delivered', 'online')).toBe('given');
  });

  it('plans walk-in Received→Washing→Ready→Given advances', () => {
    expect(getFloorAdvancePlan('confirmed', 'walk_in')).toMatchObject({
      action: 'start_wash',
      label: 'Start washing',
      patchStatuses: ['washing'],
    });
    expect(getFloorAdvancePlan('washing', 'walk_in')).toMatchObject({
      action: 'mark_ready',
      patchStatuses: ['ready'],
    });
    expect(getFloorAdvancePlan('ready', 'walk_in')).toMatchObject({
      action: 'mark_given',
      patchStatuses: ['delivered'],
    });
    expect(getFloorAdvancePlan('delivered', 'walk_in')).toBeNull();
  });

  it('chains doorstep washing→ironing→ready in one mark_ready plan', () => {
    expect(getFloorAdvancePlan('washing', 'online')).toMatchObject({
      action: 'mark_ready',
      patchStatuses: ['ironing', 'ready'],
    });
    expect(getFloorAdvancePlan('ironing', 'online')).toMatchObject({
      action: 'mark_ready',
      patchStatuses: ['ready'],
    });
  });

  it('uses accept for online confirmed Received', () => {
    expect(getFloorAdvancePlan('confirmed', 'online')).toMatchObject({
      action: 'accept',
      acceptFirst: true,
      patchStatuses: [],
    });
  });

  it('counts needs-attention for Today and Ready tiles', () => {
    const counts = countFloorOrders([
      { status: 'confirmed', order_source: 'walk_in' },
      { status: 'washing', order_source: 'walk_in' },
      { status: 'ready', order_source: 'walk_in' },
      { status: 'delivered', order_source: 'walk_in' },
      { status: 'ironing', order_source: 'online' },
    ]);
    expect(counts.received).toBe(1);
    expect(counts.washing).toBe(2);
    expect(counts.ready).toBe(1);
    expect(counts.given).toBe(1);
    expect(counts.todayAttention).toBe(3);
    expect(counts.readyAttention).toBe(1);
  });

  it('filters Given unless includeGiven', () => {
    const rows = [
      { id: '1', status: 'confirmed', order_source: 'walk_in' as const },
      { id: '2', status: 'delivered', order_source: 'walk_in' as const },
    ];
    expect(filterFloorOrders(rows, 'all', false)).toHaveLength(1);
    expect(filterFloorOrders(rows, 'all', true)).toHaveLength(2);
    expect(filterFloorOrders(rows, 'given', true)).toHaveLength(1);
  });

  it('phoneLast4 and pieceCount helpers', () => {
    expect(phoneLast4('+91 98765 43210')).toBe('3210');
    expect(phoneLast4(null)).toBeNull();
    expect(pieceCount([{ quantity: 2 }, { quantity: 3 }])).toBe(5);
    expect(pieceCount([])).toBe(0);
  });
});
