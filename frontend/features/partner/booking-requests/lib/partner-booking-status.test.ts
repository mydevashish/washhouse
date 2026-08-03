import {
  canPartnerTransitionStatus,
  isPartnerBookingTerminal,
  partnerBookingRequestsBadgeCount,
  partnerQuickStatusesFor,
} from '@/features/partner/booking-requests/lib/partner-booking-status';

describe('partner booking request status helpers', () => {
  it('allows partner transitions from assigned', () => {
    expect(canPartnerTransitionStatus('assigned', 'contacted')).toBe(true);
    expect(canPartnerTransitionStatus('assigned', 'confirmed')).toBe(true);
    expect(canPartnerTransitionStatus('assigned', 'declined')).toBe(true);
    expect(canPartnerTransitionStatus('assigned', 'cancelled')).toBe(true);
  });

  it('blocks admin-only and illegal moves', () => {
    expect(canPartnerTransitionStatus('assigned', 'reviewing')).toBe(false);
    expect(canPartnerTransitionStatus('assigned', 'new')).toBe(false);
    expect(canPartnerTransitionStatus('contacted', 'assigned')).toBe(false);
    expect(canPartnerTransitionStatus('confirmed', 'contacted')).toBe(false);
  });

  it('treats terminal statuses as closed', () => {
    expect(isPartnerBookingTerminal('declined')).toBe(true);
    expect(isPartnerBookingTerminal('cancelled')).toBe(true);
    expect(isPartnerBookingTerminal('expired')).toBe(true);
    expect(isPartnerBookingTerminal('converted_to_order')).toBe(true);
    expect(isPartnerBookingTerminal('assigned')).toBe(false);
  });

  it('exposes quick actions for current status only', () => {
    expect(partnerQuickStatusesFor('assigned')).toEqual([
      'contacted',
      'confirmed',
      'declined',
      'cancelled',
    ]);
    expect(partnerQuickStatusesFor('confirmed')).toEqual(['cancelled']);
    expect(partnerQuickStatusesFor('declined')).toEqual([]);
  });

  it('computes nav badge from assigned total when present', () => {
    expect(
      partnerBookingRequestsBadgeCount({
        assignedTotal: 4,
        inbox: { overdue: 2, new: 0, reviewing: 0 },
      }),
    ).toBe(4);
  });

  it('falls back to overdue when assigned total unknown', () => {
    expect(
      partnerBookingRequestsBadgeCount({
        inbox: { overdue: 3, new: 0, reviewing: 0 },
      }),
    ).toBe(3);
    expect(partnerBookingRequestsBadgeCount({})).toBe(0);
  });
});
