import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt = '', ...rest }: { alt?: string; fill?: boolean; src?: string }) => {
    const { fill: _fill, ...safe } = rest as { fill?: boolean } & Record<string, unknown>;
    void _fill;
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} {...safe} />;
  },
}));

describe('PartnerOrdersNewOrderSheet', () => {
  it('opens picture-led Walk-in / Doorstep / Find customer choices', async () => {
    const user = userEvent.setup();
    render(<PartnerOrdersNewOrderSheet variant="header" />);

    await user.click(screen.getByTestId('partner-orders-new-order-header'));
    expect(screen.getByTestId('partner-orders-new-order-sheet')).toBeInTheDocument();
    expect(screen.getByTestId('partner-intake-choice-walk-in')).toHaveAttribute(
      'href',
      '/partner/new-order?mode=walk_in',
    );
    expect(screen.getByTestId('partner-intake-choice-doorstep')).toHaveAttribute(
      'href',
      '/partner/new-order?mode=assisted',
    );
    expect(screen.getByTestId('partner-intake-choice-desk')).toHaveAttribute(
      'href',
      buildOrdersHubPath('/partner/orders', 'desk'),
    );
  });
});
