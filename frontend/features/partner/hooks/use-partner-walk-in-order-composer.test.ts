import { act, renderHook } from '@testing-library/react';

import { usePartnerWalkInOrderComposer } from '@/features/partner/hooks/use-partner-walk-in-order-composer';

const insightRowMock = jest.fn((_profile: unknown, _enabled: boolean) => ({
  data: null,
  isFetching: false,
}));

jest.mock('@tanstack/react-query', () => ({
  useMutation: () => ({ mutate: jest.fn(), isPending: false }),
  useQuery: () => ({ data: undefined, isLoading: false }),
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));

jest.mock('@/hooks/use-debounced-value', () => ({
  useDebouncedValue: (value: string) => value,
}));

jest.mock('@/features/partner/hooks/use-partner-operations', () => ({
  usePartnerQueriesEnabled: () => true,
  usePartnerAnalytics: () => ({ data: { laundry_id: 'laundry-1' } }),
}));

jest.mock('@/features/partner/garment-catalog/hooks/use-visible-garment-catalog-items', () => ({
  useVisibleGarmentCatalogItems: () => ({ data: [], isLoading: false }),
}));

jest.mock('@/features/partner/customer-desk/hooks', () => ({
  usePartnerCustomerDeskLookup: () => ({ data: undefined, isFetching: false }),
  usePartnerCustomerInsightRow: (profile: unknown, enabled: boolean) => insightRowMock(profile, enabled),
}));

describe('usePartnerWalkInOrderComposer insight fetch', () => {
  beforeEach(() => {
    insightRowMock.mockClear();
  });

  it('enables insight fetch when phone is valid E.164 before desk lookup completes', () => {
    const { result } = renderHook(() =>
      usePartnerWalkInOrderComposer({
        lookupActive: true,
        lookupOnlyOnCustomerStep: true,
      }),
    );

    act(() => {
      result.current.setCustomerPhone('9876543210');
      result.current.setCustomerName('Riya');
    });

    expect(insightRowMock).toHaveBeenCalled();
    const lastCall = insightRowMock.mock.calls.at(-1);
    expect(lastCall?.[1]).toBe(true);
    expect(lastCall?.[0]).toMatchObject({
      phone: '+919876543210',
      name: 'Riya',
    });
  });

  it('enables insight fetch from search profile user_id when lookup is suppressed', () => {
    const { result } = renderHook(() =>
      usePartnerWalkInOrderComposer({
        lookupActive: true,
        lookupOnlyOnCustomerStep: true,
      }),
    );

    act(() => {
      result.current.applyCustomerFromSearch({
        user_id: 'user-123',
        name: 'Riya',
        phone: '+919876543210',
        email: null,
        registered: true,
        order_count: 4,
        last_order_at: '2026-01-01T00:00:00.000Z',
      });
    });

    const lastCall = insightRowMock.mock.calls.at(-1);
    expect(lastCall?.[1]).toBe(true);
    expect(lastCall?.[0]).toMatchObject({
      user_id: 'user-123',
      phone: '+919876543210',
      registered: true,
    });
  });

  it('setServiceQty adds a new service line when incrementing from zero', () => {
    const { result } = renderHook(() => usePartnerWalkInOrderComposer());

    act(() => {
      result.current.setServiceQty('svc-wash-fold', 0.5);
    });

    expect(result.current.serviceItems).toEqual([
      { service_id: 'svc-wash-fold', quantity: 0.5 },
    ]);

    act(() => {
      result.current.setServiceQty('svc-wash-fold', 1);
    });

    expect(result.current.serviceItems).toEqual([
      { service_id: 'svc-wash-fold', quantity: 1 },
    ]);
  });

  it('setServiceQty supports 0.5 kg step increments like Wash & Fold +/- buttons', () => {
    const { result } = renderHook(() => usePartnerWalkInOrderComposer());
    const serviceId = 'svc-wash-fold';

    const bump = (delta: 1 | -1) => {
      const selectedQty =
        result.current.serviceItems.find((item) => item.service_id === serviceId)?.quantity ?? 0;
      const nextQty =
        delta < 0
          ? Math.max(0, Number((selectedQty - 0.5).toFixed(2)))
          : Number((selectedQty + 0.5).toFixed(2));
      if (nextQty <= 0) {
        result.current.removeServiceLine(serviceId);
        return;
      }
      result.current.setServiceQty(serviceId, nextQty);
    };

    act(() => bump(1));
    expect(result.current.serviceItems).toEqual([{ service_id: serviceId, quantity: 0.5 }]);

    act(() => bump(1));
    act(() => bump(1));
    expect(result.current.serviceItems).toEqual([{ service_id: serviceId, quantity: 1.5 }]);

    act(() => bump(-1));
    expect(result.current.serviceItems).toEqual([{ service_id: serviceId, quantity: 1 }]);

    act(() => {
      result.current.setServiceQty(serviceId, 2.5);
    });
    expect(result.current.serviceItems).toEqual([{ service_id: serviceId, quantity: 2.5 }]);
  });
});
