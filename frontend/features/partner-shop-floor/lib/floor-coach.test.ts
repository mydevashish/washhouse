import {
  floorCoachCopy,
  recordCoachOrderCreated,
  shouldShowFloorCoach,
  writeCoachOrderCount,
} from '@/features/partner-shop-floor/lib/floor-coach';
import {
  PARTNER_FLOOR_COACH_ORDER_LIMIT,
  PARTNER_FLOOR_COACH_ORDERS_KEY,
} from '@/features/partner-shop-floor/types';

describe('floor coach', () => {
  beforeEach(() => {
    window.localStorage.removeItem(PARTNER_FLOOR_COACH_ORDERS_KEY);
  });

  it('shows for first N orders only', () => {
    expect(shouldShowFloorCoach(0)).toBe(true);
    expect(shouldShowFloorCoach(PARTNER_FLOOR_COACH_ORDER_LIMIT - 1)).toBe(true);
    expect(shouldShowFloorCoach(PARTNER_FLOOR_COACH_ORDER_LIMIT)).toBe(false);
  });

  it('increments localStorage count on create', () => {
    expect(recordCoachOrderCreated()).toBe(1);
    expect(recordCoachOrderCreated()).toBe(2);
    expect(window.localStorage.getItem(PARTNER_FLOOR_COACH_ORDERS_KEY)).toBe('2');
  });

  it('returns English next-step copy', () => {
    writeCoachOrderCount(0);
    expect(floorCoachCopy('customer').english.toLowerCase()).toContain('phone');
    expect(floorCoachCopy('success').english.toLowerCase()).toContain('print');
  });
});
