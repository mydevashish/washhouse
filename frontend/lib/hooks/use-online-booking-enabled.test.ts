import {
  OFFLINE_BOOKING_TITLE,
  offlineBookingBody,
} from '@/lib/hooks/use-online-booking-enabled';

describe('offline booking copy', () => {
  it('uses call-to-book banner title', () => {
    expect(OFFLINE_BOOKING_TITLE).toBe('Book by phone or WhatsApp');
  });

  it('mentions browsing prices and contacting the shop', () => {
    expect(offlineBookingBody('Quick Wash')).toMatch(/browse prices/i);
    expect(offlineBookingBody('Quick Wash')).toMatch(/Quick Wash/);
  });
});
