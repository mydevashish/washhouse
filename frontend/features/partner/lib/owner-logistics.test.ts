import {
  filterLogisticsRuns,
  flattenQueueOrders,
  logisticsRunFamily,
  matchesLogisticsSearch,
} from '@/features/partner/lib/owner-logistics';
import type { PartnerOrder } from '@/services/partner';

describe('owner logistics helpers', () => {
  it('maps status to run family', () => {
    expect(logisticsRunFamily('confirmed')).toBe('pickup');
    expect(logisticsRunFamily('ready')).toBe('ready');
    expect(logisticsRunFamily('out_for_delivery')).toBe('out');
    expect(logisticsRunFamily('delivered')).toBe('done');
  });

  it('flattens queue buckets without duplicates', () => {
    const rows = flattenQueueOrders([
      {
        orders: [
          {
            order_id: '1',
            tracking_code: 'A',
            customer_name: 'Riya',
            status: 'confirmed',
            pickup_at: '',
            delivery_at: '',
            total_inr: '0',
            is_delayed: false,
            queue_status: 'scheduled',
            assignment: null,
          },
        ],
      },
      {
        orders: [
          {
            order_id: '1',
            tracking_code: 'A',
            customer_name: 'Riya',
            status: 'confirmed',
            pickup_at: '',
            delivery_at: '',
            total_inr: '0',
            is_delayed: false,
            queue_status: 'scheduled',
            assignment: null,
          },
          {
            order_id: '2',
            tracking_code: 'B',
            customer_name: 'Aman',
            status: 'pickup_assigned',
            pickup_at: '',
            delivery_at: '',
            total_inr: '0',
            is_delayed: false,
            queue_status: 'assigned',
            assignment: { id: 'x', staff_id: 's', staff_name: 'Dev', status: 'assigned', assigned_at: '', started_at: null, completed_at: null },
          },
        ],
      },
    ]);
    expect(rows).toHaveLength(2);
  });

  it('filters by query and staff', () => {
    const rows = [
      {
        customer_name: 'Riya',
        tracking_code: 'T1',
        assignment: { staff_name: 'Dev' },
      },
      {
        customer_name: 'Aman',
        tracking_code: 'T2',
        assignment: null,
      },
    ];
    expect(filterLogisticsRuns(rows, 'riya', null, (r) => r.assignment?.staff_name)).toHaveLength(1);
    expect(filterLogisticsRuns(rows, '', 'Dev', (r) => r.assignment?.staff_name)).toHaveLength(1);
  });

  it('matches partner order search including phone and token', () => {
    const order = {
      customer_name: 'Riya',
      tracking_code: 'ABC',
      customer_phone: '9876543210',
      token_code: 'R-42',
    } as PartnerOrder;
    expect(matchesLogisticsSearch(order, '98765')).toBe(true);
    expect(matchesLogisticsSearch(order, 'r-42')).toBe(true);
    expect(matchesLogisticsSearch(order, 'zzz')).toBe(false);
  });
});
