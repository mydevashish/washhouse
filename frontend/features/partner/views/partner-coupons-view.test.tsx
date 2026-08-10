import { render, waitFor } from '@testing-library/react';

import { PartnerCouponsView } from '@/features/partner/views/partner-coupons-view';

const replace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: jest.fn() }),
}));

describe('PartnerCouponsView', () => {
  beforeEach(() => {
    replace.mockClear();
  });

  it('redirects to orders hub coupons workspace', async () => {
    render(<PartnerCouponsView />);
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/partner/orders?workspace=coupons');
    });
  });
});
