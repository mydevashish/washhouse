import { render, screen } from '@testing-library/react';

import {
  PartnerOpsKpiGrid,
  PartnerOpsStatusBars,
  PartnerOpsTrendStrip,
} from '@/features/partner/components/ops-visual';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

describe('Partner ops-visual primitives', () => {
  it('renders KPI labels and linked unpaid tile', () => {
    render(
      <PartnerOpsKpiGrid
        items={[
          { label: 'Orders today', value: '4' },
          { label: 'Unpaid orders', value: '2', href: '/partner/orders?chip=unpaid' },
        ]}
      />,
    );
    expect(screen.getByText('Orders today')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Unpaid orders/i })).toHaveAttribute(
      'href',
      '/partner/orders?chip=unpaid',
    );
  });

  it('shows trend empty state when all values are zero', () => {
    render(
      <PartnerOpsTrendStrip
        data={[
          { label: 'Mon', value: 0 },
          { label: 'Tue', value: 0 },
        ]}
        emptyHref="/partner/revenue"
      />,
    );
    expect(screen.getByText(/Weekly chart coming soon/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open revenue/i })).toHaveAttribute('href', '/partner/revenue');
  });

  it('renders status bar counts for assistive labels', () => {
    render(
      <PartnerOpsStatusBars
        rows={[{ label: 'Ready', value: 3, colorToken: 'success' }]}
        aria-label="Queue"
      />,
    );
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByRole('meter', { name: 'Ready: 3' })).toBeInTheDocument();
  });
});
