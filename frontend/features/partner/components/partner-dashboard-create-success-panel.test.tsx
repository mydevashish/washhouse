import { render, screen } from '@testing-library/react';

import { PartnerDashboardCreateSuccessPanel } from '@/features/partner/components/partner-dashboard-create-success-panel';
import type { WalkInOrder } from '@/services/partner-walk-in-orders';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

const order = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  tracking_code: 'WH-DASH-001',
  token_code: 'R-7',
  color_token: 'red',
  customer_name: 'Dash Test',
  customer_phone: '+919876543210',
  total_inr: '236.00',
  items: [{ service_name: 'Wash & Fold', quantity: 2, line_total_inr: '200.00' }],
} as WalkInOrder;

describe('PartnerDashboardCreateSuccessPanel', () => {
  it('shows print tags CTA with floor print route', () => {
    render(<PartnerDashboardCreateSuccessPanel order={order} />);
    expect(screen.getByTestId('partner-dashboard-print-tags')).toHaveAttribute(
      'href',
      '/partner/floor/print/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/tags',
    );
  });
});
