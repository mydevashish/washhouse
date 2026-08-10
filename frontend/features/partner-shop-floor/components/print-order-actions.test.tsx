import { render, screen } from '@testing-library/react';

import { PrintOrderActions } from '@/features/partner-shop-floor/components/print-order-actions';

describe('PrintOrderActions', () => {
  it('hides bill and GST invoice before handover when orderStatus is set', () => {
    render(<PrintOrderActions orderId="ord-42" orderStatus="washing" />);
    expect(screen.getByTestId('print-tags-link')).toBeInTheDocument();
    expect(screen.queryByTestId('print-bill-link')).not.toBeInTheDocument();
    expect(screen.queryByTestId('print-gst-invoice-link')).not.toBeInTheDocument();
  });

  it('shows bill and GST invoice for ready orders', () => {
    render(<PrintOrderActions orderId="ord-42" orderStatus="ready" emphasize="bill" />);
    expect(screen.getByTestId('print-bill-link')).toBeInTheDocument();
    expect(screen.getByTestId('print-gst-invoice-link')).toBeInTheDocument();
  });

  it('renders tags, bill, and GST invoice links', () => {
    render(<PrintOrderActions orderId="ord-42" orderStatus="ready" />);
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
    render(
      <PrintOrderActions orderId="ord-42" layout="compact" emphasize="tags" orderStatus="ready" />,
    );
    expect(screen.getByTestId('print-order-actions')).toHaveAttribute('data-layout', 'compact');
    expect(screen.getByLabelText('Print tags')).toBeInTheDocument();
    expect(screen.getByLabelText('Print bill')).toBeInTheDocument();
  });
});
