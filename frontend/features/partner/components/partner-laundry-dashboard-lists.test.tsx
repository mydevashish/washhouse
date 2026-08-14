import { render, screen } from '@testing-library/react';

import { PartnerLaundryRecentOrdersCard } from '@/features/partner/components/partner-laundry-dashboard-lists';
import { PARTNER_DASHBOARD_RECENT_VIEW_ALL_HREF } from '@/features/partner/lib/partner-dashboard-lists';

describe('PartnerLaundryRecentOrdersCard', () => {
  it('renders tracking codes from the mapped list and View all href', () => {
    render(
      <PartnerLaundryRecentOrdersCard
        loading={false}
        error={null}
        rows={[
          {
            id: 'ord-1',
            href: '/partner/orders/ord-1',
            trackingCode: 'WH-1001',
            customer: 'Anita',
            service: 'Dry Cleaning',
            amount: '₹450',
            statusPill: 'In Process',
          },
        ]}
      />,
    );

    expect(screen.getByText('WH-1001')).toBeInTheDocument();
    expect(screen.queryByText('#ORD-1256')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'WH-1001' })).toHaveAttribute(
      'href',
      '/partner/orders/ord-1',
    );
    expect(screen.getByRole('link', { name: 'View all recent orders' })).toHaveAttribute(
      'href',
      PARTNER_DASHBOARD_RECENT_VIEW_ALL_HREF,
    );
    expect(PARTNER_DASHBOARD_RECENT_VIEW_ALL_HREF).toBe('/partner/orders');
  });
});
