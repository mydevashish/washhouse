import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

import { PartnerUiModeToggle } from '@/features/partner-shop-floor/components/partner-ui-mode-toggle';
import { ShopFloorHomeView } from '@/features/partner-shop-floor/views/shop-floor-home-view';
import { usePartnerUiModeStore } from '@/features/partner-shop-floor/store/partner-ui-mode.store';
import { DEFAULT_PARTNER_UI_MODE } from '@/features/partner-shop-floor/types';

jest.mock('@/lib/hooks/use-store-hydrated', () => ({
  useStoreHydrated: () => true,
}));

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

describe('PartnerUiModeToggle', () => {
  beforeEach(() => {
    usePartnerUiModeStore.setState({ mode: DEFAULT_PARTNER_UI_MODE });
  });

  it('toggles shop_floor ↔ advanced via pressed buttons', async () => {
    const user = userEvent.setup();
    render(<PartnerUiModeToggle />);

    const shopFloor = screen.getByRole('button', { name: /Shop Floor/i });
    const advanced = screen.getByRole('button', { name: /Advanced/i });

    expect(shopFloor).toHaveAttribute('aria-pressed', 'true');
    expect(advanced).toHaveAttribute('aria-pressed', 'false');

    await user.click(advanced);
    expect(usePartnerUiModeStore.getState().mode).toBe('advanced');
    expect(advanced).toHaveAttribute('aria-pressed', 'true');
    expect(shopFloor).toHaveAttribute('aria-pressed', 'false');

    await user.click(shopFloor);
    expect(usePartnerUiModeStore.getState().mode).toBe('shop_floor');
  });
});

describe('ShopFloorHomeView', () => {
  it('renders exactly 4 primary tiles (no charts)', () => {
    const { container } = render(<ShopFloorHomeView />);
    const grid = container.querySelector('[data-testid="shop-floor-home-tiles"]');
    expect(grid?.querySelectorAll('a')).toHaveLength(4);
    expect(screen.getByRole('heading', { name: 'Shop Floor' })).toBeInTheDocument();
    expect(screen.queryByText(/revenue/i)).not.toBeInTheDocument();
  });
});
