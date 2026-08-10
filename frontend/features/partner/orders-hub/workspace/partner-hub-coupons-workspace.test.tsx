import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

import {
  PartnerHubCouponsCreateDialog,
  PartnerHubCouponsWorkspaceBody,
  usePartnerHubCoupons,
  usePartnerHubCouponsMutations,
} from '@/features/partner/orders-hub/workspace/partner-hub-coupons-workspace';
import {
  createPartnerCoupon,
  listPartnerCoupons,
  updatePartnerCoupon,
} from '@/services/partner-coupons';

jest.mock('@/features/partner/hooks/use-partner-operations', () => ({
  usePartnerQueriesEnabled: () => true,
}));

jest.mock('@/features/partner/components/ops-visual', () => ({
  PartnerOpsSurface: ({ children, ...rest }: { children: React.ReactNode }) => (
    <div {...rest}>{children}</div>
  ),
}));

jest.mock('@/services/partner-coupons', () => ({
  listPartnerCoupons: jest.fn(),
  createPartnerCoupon: jest.fn(),
  updatePartnerCoupon: jest.fn(),
  deletePartnerCoupon: jest.fn(),
}));

const sampleCoupon = {
  id: 'c1',
  code: 'SAVE10',
  discount_percent: '10',
  is_active: true,
};

function CouponsBodyProbe() {
  const couponsQ = usePartnerHubCoupons();
  const mutations = usePartnerHubCouponsMutations();
  return <PartnerHubCouponsWorkspaceBody couponsQ={couponsQ} mutations={mutations} />;
}

function wrap(children: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('PartnerHubCouponsWorkspace (Prompt 5)', () => {
  beforeEach(() => {
    jest.mocked(listPartnerCoupons).mockResolvedValue([sampleCoupon]);
    jest.mocked(createPartnerCoupon).mockResolvedValue(sampleCoupon);
    jest.mocked(updatePartnerCoupon).mockResolvedValue({ ...sampleCoupon, is_active: false });
  });

  it('creates a coupon via dialog submit', async () => {
    const user = userEvent.setup();
    render(
      wrap(
        <PartnerHubCouponsCreateDialog open onOpenChange={() => {}} />,
      ),
    );

    await user.type(screen.getByLabelText(/code/i), 'NEW20');
    await user.click(screen.getByTestId('hub-coupons-create-submit'));

    await waitFor(() => {
      expect(createPartnerCoupon).toHaveBeenCalledWith({
        code: 'NEW20',
        discount_percent: 10,
      });
    });
  });

  it('toggles coupon active state', async () => {
    const user = userEvent.setup();
    render(wrap(<CouponsBodyProbe />));

    await waitFor(() => {
      expect(screen.getByTestId('hub-coupon-toggle-c1')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('hub-coupon-toggle-c1'));

    await waitFor(() => {
      expect(updatePartnerCoupon).toHaveBeenCalledWith('c1', { is_active: false });
    });
  });
});
