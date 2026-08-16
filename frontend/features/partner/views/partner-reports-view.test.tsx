import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { PartnerReportsView } from '@/features/partner/views/partner-reports-view';

const listPartnerOrders = jest.fn();
const usePartnerQueriesEnabled = jest.fn(() => true);

jest.mock('@/services/partner', () => ({
  listPartnerOrders: (...args: unknown[]) => listPartnerOrders(...args),
}));

jest.mock('@/features/partner/hooks/use-partner-operations', () => ({
  usePartnerQueriesEnabled: () => usePartnerQueriesEnabled(),
  usePartnerOrders: (params: Record<string, unknown>) => {
    const enabled = usePartnerQueriesEnabled();
    if (enabled && params.date_from && params.date_to) {
      void listPartnerOrders(params);
    }
    return {
      data: {
        items: [
          {
            id: 'ord-1',
            tracking_code: 'DLM001',
            customer_name: 'Riya',
            status: 'delivered',
            payment_status: 'paid',
            total_inr: '500.00',
            items: [{ service_name: 'Wash', quantity: 1 }],
          },
        ],
        total_records: 1,
      },
      isLoading: false,
    };
  },
}));

describe('PartnerReportsView', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-15T12:00:00+05:30'));
    listPartnerOrders.mockClear();
    usePartnerQueriesEnabled.mockReturnValue(true);
    URL.createObjectURL = jest.fn(() => 'blob:mock');
    URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('passes IST date range to orders list for export', async () => {
    render(<PartnerReportsView />);

    await waitFor(() => {
      expect(listPartnerOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          bucket: 'all',
          page_size: 5000,
          date_from: '2026-08-01',
          date_to: '2026-08-31',
        }),
      );
    });

    fireEvent.click(screen.getByTestId('partner-reports-period-week'));

    await waitFor(() => {
      expect(listPartnerOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          date_from: '2026-08-10',
          date_to: '2026-08-16',
        }),
      );
    });
  });

  it('names CSV export with the selected range slug', () => {
    const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<PartnerReportsView />);
    fireEvent.click(screen.getByTestId('partner-reports-export-orders'));

    expect(clickSpy).toHaveBeenCalled();
    const anchor = clickSpy.mock.instances[0] as unknown as HTMLAnchorElement;
    expect(anchor.download).toBe('orders-report-2026-08-01_2026-08-31.csv');

    clickSpy.mockRestore();
  });
});
