import {
  getWalkInActionLabel,
  getWalkInNextStatus,
  isOrderNeedsAction,
  isWalkInOrderActive,
} from '@/features/partner/lib/partner-status';

describe('walk-in order status helpers', () => {
  it('skips accept/reject for walk-in confirmed orders', () => {
    expect(isOrderNeedsAction('confirmed', 'walk_in')).toBe(false);
    expect(isOrderNeedsAction('confirmed', 'online')).toBe(true);
  });

  it('advances confirmed → washing → ready → delivered', () => {
    expect(getWalkInNextStatus('confirmed')).toBe('washing');
    expect(getWalkInNextStatus('washing')).toBe('ready');
    expect(getWalkInNextStatus('ready')).toBe('delivered');
    expect(getWalkInNextStatus('delivered')).toBeNull();
  });

  it('exposes partner-friendly action labels', () => {
    expect(getWalkInActionLabel('confirmed')).toBe('Start washing');
    expect(getWalkInActionLabel('washing')).toBe('Mark ready');
    expect(getWalkInActionLabel('ready')).toBe('Mark delivered');
  });

  it('treats delivered and cancelled as inactive', () => {
    expect(isWalkInOrderActive('washing')).toBe(true);
    expect(isWalkInOrderActive('delivered')).toBe(false);
    expect(isWalkInOrderActive('cancelled')).toBe(false);
  });
});
