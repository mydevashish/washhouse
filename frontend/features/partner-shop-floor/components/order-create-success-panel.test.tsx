import { render, screen } from '@testing-library/react';

import { OrderCreateSuccessPanel } from '@/features/partner-shop-floor/components/order-create-success-panel';

jest.mock('@/features/partner-shop-floor/hooks/use-partner-floor-voice', () => ({
  usePartnerFloorVoice: () => ({ speak: jest.fn(), hydrated: true }),
}));

jest.mock('@/lib/hooks/use-prefers-reduced-motion', () => ({
  usePrefersReducedMotion: () => true,
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: { alt?: string }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={props.alt ?? ''} />;
  },
}));

describe('OrderCreateSuccessPanel', () => {
  it('shows Print tags as the primary CTA', () => {
    render(
      <OrderCreateSuccessPanel
        order={{
          id: 'ord-9',
          tracking_code: 'WH9',
          customer_name: 'Riya',
          customer_phone: '+919876543210',
          total_inr: '250.00',
        }}
      />,
    );

    expect(screen.getByTestId('walk-in-success-panel')).toBeInTheDocument();
    const printTags = screen.getByTestId('walk-in-success-print-tags');
    expect(printTags).toHaveAttribute('href', '/partner/floor/print/ord-9/tags');
    expect(printTags).toHaveTextContent(/print tags/i);
    expect(screen.getByTestId('print-bill-link')).toBeInTheDocument();
    expect(screen.getByTestId('walk-in-success-another')).toBeInTheDocument();
  });
});
