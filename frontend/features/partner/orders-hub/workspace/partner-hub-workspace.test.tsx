import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Ticket, Package, Sparkles, Users } from 'lucide-react';

import {
  PartnerHubPillarCard,
  PartnerHubPillarGrid,
  PartnerHubWorkspaceModal,
  usePartnerHubWorkspaceUrl,
} from '@/features/partner/orders-hub/workspace';

const replace = jest.fn();
let searchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: jest.fn() }),
  useSearchParams: () => searchParams,
}));

function ModalFromUrl() {
  const { workspace } = usePartnerHubWorkspaceUrl();
  return (
    <PartnerHubWorkspaceModal workspace={workspace} title="Customers workspace">
      <p>Modal body</p>
    </PartnerHubWorkspaceModal>
  );
}

describe('Partner hub workspace shell (Prompt 2)', () => {
  beforeEach(() => {
    replace.mockClear();
    searchParams = new URLSearchParams();
  });

  it('renders four pillar cards in the grid', () => {
    render(
      <PartnerHubPillarGrid>
        <PartnerHubPillarCard
          id="customers"
          title="Customers"
          icon={Users}
          primaryMetric="128 total"
          secondaryMetric="+6 this week"
          onOpen={() => {}}
        />
        <PartnerHubPillarCard
          id="orders"
          title="Orders"
          icon={Package}
          primaryMetric="412 total"
          secondaryMetric="28 this week"
          onOpen={() => {}}
        />
        <PartnerHubPillarCard
          id="coupons"
          title="Coupons"
          icon={Ticket}
          primaryMetric="3 active"
          secondaryMetric="5 total"
          onOpen={() => {}}
        />
        <PartnerHubPillarCard
          id="services"
          title="Services"
          icon={Sparkles}
          primaryMetric="6 services"
          secondaryMetric="from ₹49"
          onOpen={() => {}}
        />
      </PartnerHubPillarGrid>,
    );

    expect(screen.getByTestId('hub-pillar-grid')).toBeInTheDocument();
    expect(screen.getByTestId('hub-pillar-customers')).toBeInTheDocument();
    expect(screen.getByTestId('hub-pillar-orders')).toBeInTheDocument();
    expect(screen.getByTestId('hub-pillar-coupons')).toBeInTheDocument();
    expect(screen.getByTestId('hub-pillar-services')).toBeInTheDocument();
  });

  it('shows workspace modal test id when workspace query param is set', () => {
    searchParams = new URLSearchParams('workspace=customers');
    render(<ModalFromUrl />);

    expect(screen.getByTestId('hub-workspace-customers')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /customers workspace/i })).toBeInTheDocument();
  });

  it('clears workspace param on dialog close', async () => {
    const user = userEvent.setup();
    searchParams = new URLSearchParams('tab=orders&workspace=orders');
    render(<ModalFromUrl />);

    await user.click(screen.getByRole('button', { name: /close dialog/i }));
    expect(replace).toHaveBeenCalledWith('/partner/orders?tab=orders', { scroll: false });
  });
});
