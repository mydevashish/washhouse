import { render, screen } from '@testing-library/react';

import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { PARTNER_PAGE } from '@/features/partner/lib/partner-compact';

describe('PartnerContent', () => {
  it('applies compact page shell padding', () => {
    const { container } = render(
      <PartnerContent>
        <p>Body</p>
      </PartnerContent>,
    );
    const shell = container.firstChild as HTMLElement;
    expect(shell).toHaveClass('px-4', 'py-3', 'sm:px-5', 'sm:py-3');
    expect(shell).not.toHaveClass('sm:px-6', 'sm:py-4', 'py-6');
  });

  it('merges optional className with shell layout', () => {
    const { container } = render(
      <PartnerContent className={PARTNER_PAGE}>
        <p>Body</p>
      </PartnerContent>,
    );
    const shell = container.firstChild as HTMLElement;
    expect(shell).toHaveClass('space-y-4');
  });
});

describe('PartnerPageHeader', () => {
  it('uses page-title for the main heading', () => {
    render(<PartnerPageHeader title="Customers" description="CRM list" />);
    const heading = screen.getByRole('heading', { level: 1, name: 'Customers' });
    expect(heading).toHaveClass('page-title');
    expect(heading).not.toHaveClass('text-2xl', 'text-3xl');
  });
});
