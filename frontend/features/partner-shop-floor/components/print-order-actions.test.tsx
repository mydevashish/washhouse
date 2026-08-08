import { render, screen } from '@testing-library/react';

import { PrintOrderActions } from '@/features/partner-shop-floor/components/print-order-actions';

describe('PrintOrderActions', () => {
  it('renders tags, bill, and GST invoice links', () => {
    render(<PrintOrderActions orderId="ord-42" />);
    expect(screen.getByTestId('print-tags-link')).toHaveAttribute(
      'href',
      '/partner/floor/print/ord-42/tags',
    );
    expect(screen.getByTestId('print-bill-link')).toHaveAttribute(
      'href',
      '/partner/floor/print/ord-42/bill',
    );
    expect(screen.getByTestId('print-gst-invoice-link')).toHaveAttribute(
      'href',
      '/partner/floor/print/ord-42/invoice',
    );
  });

  it('marks bill as primary when emphasize=bill', () => {
    render(<PrintOrderActions orderId="ord-42" emphasize="bill" />);
    const root = screen.getByTestId('print-order-actions');
    expect(root).toHaveAttribute('data-emphasize', 'bill');
    expect(screen.getByTestId('print-bill-link').className).toMatch(/bg-button/);
    expect(screen.getByTestId('print-tags-link').className).toMatch(/border/);
  });

  it('renders compact icon links for hub rows', () => {
    render(<PrintOrderActions orderId="ord-42" layout="compact" emphasize="tags" />);
    expect(screen.getByTestId('print-order-actions')).toHaveAttribute('data-layout', 'compact');
    expect(screen.getByLabelText('Print tags')).toBeInTheDocument();
    expect(screen.getByLabelText('Print bill')).toBeInTheDocument();
  });
});
