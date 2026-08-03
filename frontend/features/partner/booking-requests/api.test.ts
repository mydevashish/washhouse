import { buildPartnerBookingListParams } from '@/features/partner/booking-requests/api-params';

describe('partner booking request list params', () => {
  it('strips IDOR-sensitive client filters', () => {
    expect(
      buildPartnerBookingListParams({
        page: 1,
        status: 'assigned',
        include_deleted: true,
        unassigned: true,
        assigned_laundry_id: 'other-laundry-uuid',
        phone: '+919876543210',
      }),
    ).toEqual({
      page: 1,
      status: 'assigned',
      phone: '+919876543210',
    });
  });

  it('keeps partner-safe filters', () => {
    expect(
      buildPartnerBookingListParams({
        q: 'BR-',
        priority: 'urgent',
        sort: 'sla',
        page_size: 20,
      }),
    ).toEqual({
      q: 'BR-',
      priority: 'urgent',
      sort: 'sla',
      page_size: 20,
    });
  });
});
