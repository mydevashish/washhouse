import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import { PartnerOrdersNewOrderSheet } from '@/features/partner/orders-hub/partner-orders-new-order-sheet';
import { buildOrdersHubPath } from '@/lib/navigation/orders-hub';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...rest
  }: {
    children: ReactNode;
    href: string;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe('PartnerOrdersNewOrderSheet', () => {
  it('links header and FAB to Create order tab', () => {
    const createHref = buildOrdersHubPath('/partner/orders', 'create');
    const { rerender } = render(<PartnerOrdersNewOrderSheet variant="header" />);

    expect(screen.getByTestId('partner-orders-new-order-header')).toHaveAttribute(
      'href',
      createHref,
    );

    rerender(<PartnerOrdersNewOrderSheet variant="fab" />);
    expect(screen.getByTestId('partner-orders-new-order-fab')).toHaveAttribute('href', createHref);
  });
});
