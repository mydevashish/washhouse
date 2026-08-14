import {
  formatDashboardWalletDisplay,
  mapPartnerDashboardPaymentRows,
  mapPartnerDashboardTopServices,
  PARTNER_DASHBOARD_PAYMENTS_VIEW_ALL_HREF,
  PARTNER_DASHBOARD_SERVICES_HREF,
} from '@/features/partner/lib/partner-dashboard-mix';

describe('formatDashboardWalletDisplay', () => {
  it('never formats a rupee amount when wallet_tracked is false', () => {
    const row = formatDashboardWalletDisplay(false, '5930.00');
    expect(row.value).toBe('—');
    expect(row.hint).toBe('Not tracked');
    expect(row.value).not.toMatch(/₹/);
    expect(row.value).not.toMatch(/5,?930/);
    expect(JSON.stringify(row)).not.toMatch(/5930/);
  });
});

describe('mapPartnerDashboardPaymentRows', () => {
  it('maps Cash/UPI/Pending and keeps Wallet untracked', () => {
    const rows = mapPartnerDashboardPaymentRows({
      cash_paid_inr: '52350.00',
      upi_paid_inr: '61820.00',
      wallet_tracked: false,
      pending_inr: '4850.00',
    });
    expect(rows.map((r) => r.key)).toEqual(['cash', 'upi', 'wallet', 'pending']);
    expect(rows[2]).toMatchObject({ label: 'Wallet', value: '—', hint: 'Not tracked' });
    expect(rows[2]?.value).not.toMatch(/₹/);
    expect(PARTNER_DASHBOARD_PAYMENTS_VIEW_ALL_HREF).toBe('/partner/revenue');
  });
});

describe('mapPartnerDashboardTopServices', () => {
  it('uses share_pct for bar width and empty list stays empty', () => {
    const rows = mapPartnerDashboardTopServices([
      { name: 'Dry Cleaning', order_lines: 10, share_pct: '40.0' },
    ]);
    expect(rows[0]).toMatchObject({
      name: 'Dry Cleaning',
      orderLines: 10,
      linesLabel: '10 Orders',
      sharePct: 40,
      shareLabel: '40.0%',
    });
    expect(mapPartnerDashboardTopServices([])).toEqual([]);
    expect(PARTNER_DASHBOARD_SERVICES_HREF).toBe('/partner/services');
  });
});
