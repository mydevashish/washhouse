'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Loader2, Printer } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { QueryErrorState } from '@/components/feedback/query-error-state';
import { CatalogGarmentThumb } from '@/features/laundry-price-list/components/catalog-garment-thumb';
import { ColorTokenChip } from '@/features/partner-shop-floor/components/color-token-chip';
import {
  formatGstLineLabel,
  halfGstRate,
  moneyInr,
} from '@/features/partner-shop-floor/lib/invoice-display';
import { resolveOrderLinePhoto } from '@/features/partner-shop-floor/lib/order-line-photo';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { getPartnerOrderInvoice } from '@/services/partner-order-invoice';
import { cn } from '@/lib/utils';

type PrintOrderInvoiceViewProps = {
  orderId: string;
};

export function PrintOrderInvoiceView({ orderId }: PrintOrderInvoiceViewProps) {
  const invoiceQ = useQuery({
    queryKey: ['partner-order-invoice', orderId],
    queryFn: () => getPartnerOrderInvoice(orderId),
    enabled: Boolean(orderId),
  });

  const payload = invoiceQ.data;
  const delivery = useMemo(() => {
    if (!payload) return 0;
    return Number(payload.delivery_fee_inr);
  }, [payload]);

  if (invoiceQ.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        Loading GST invoice…
      </div>
    );
  }

  if (invoiceQ.isError || !payload) {
    return (
      <QueryErrorState
        title="Could not load GST invoice"
        message={getApiErrorMessage(invoiceQ.error, 'Invoice unavailable')}
        onRetry={() => void invoiceQ.refetch()}
        isRetrying={invoiceQ.isFetching}
      />
    );
  }

  const half = halfGstRate(payload.gst_rate);

  return (
    <div
      data-testid="print-order-invoice"
      data-print-format="a4"
      className="mx-auto max-w-3xl space-y-4 p-4 print:max-w-none print:p-0"
    >
      <style>{`
        @media print {
          @page { size: A4; margin: 14mm; }
        }
      `}</style>

      <div className="no-print space-y-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm text-muted-foreground">A4 GST invoice</p>
            <p className="font-mono text-sm font-semibold">{payload.invoice_number}</p>
          </div>
          <Button type="button" className="min-h-12 gap-2" onClick={() => window.print()}>
            <Printer className="h-5 w-5" aria-hidden />
            Print
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="ghost" size="sm" asChild>
            <Link href={`/partner/floor/print/${orderId}/bill`}>Counter bill</Link>
          </Button>
          <Button type="button" variant="ghost" size="sm" asChild>
            <Link href="/partner/floor/print">Print center</Link>
          </Button>
        </div>
      </div>

      <article
        className={cn(
          'print-invoice-sheet invoice-card rounded-xl border border-border bg-white p-6 text-black shadow-sm',
          'print:rounded-none print:border-0 print:p-0 print:shadow-none',
        )}
      >
        <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-black pb-4">
          <div>
            <h1 className="text-2xl font-bold">{payload.laundry_name}</h1>
            {payload.laundry_address ? (
              <p className="mt-1 text-sm text-neutral-600">{payload.laundry_address}</p>
            ) : null}
            {payload.laundry_city ? (
              <p className="text-sm text-neutral-600">{payload.laundry_city}</p>
            ) : null}
            <p className="mt-2 text-sm">
              GSTIN:{' '}
              {payload.laundry_gstin
                ? payload.laundry_gstin
                : '— (add in Advanced when available)'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Tax Invoice
            </p>
            <p className="font-mono text-lg font-bold" data-testid="invoice-number">
              {payload.invoice_number}
            </p>
            <p className="font-mono text-xs text-neutral-600">#{payload.tracking_code}</p>
            {payload.token_code ? (
              <div className="mt-2 flex justify-end">
                <ColorTokenChip
                  colorToken={payload.color_token}
                  tokenCode={payload.token_code}
                  size="md"
                  showLabel
                />
              </div>
            ) : null}
          </div>
        </header>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Bill to</p>
            <p className="font-semibold">{payload.customer_name}</p>
            <p className="text-sm">{payload.customer_phone || '—'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">GST summary</p>
            <p className="text-sm">
              Rate: {moneyInr(payload.gst_rate)}% (CGST {half}% + SGST {half}%)
            </p>
            <p className="text-sm">Payment: {payload.payment_status}</p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-300 text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className="py-2 pr-2">#</th>
                <th className="py-2 pr-2">Item</th>
                <th className="py-2 pr-2 text-right">Qty</th>
                <th className="py-2 pr-2 text-right">Rate</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payload.lines.map((line, idx) => {
                const photo = resolveOrderLinePhoto(line.service_name);
                return (
                  <tr
                    key={`${line.service_name}-${idx}`}
                    className="border-b border-neutral-200"
                    data-testid="invoice-line"
                  >
                    <td className="py-2 pr-2 align-top tabular-nums">{idx + 1}</td>
                    <td className="py-2 pr-2 align-top">
                      <div className="flex items-center gap-2">
                        <CatalogGarmentThumb photo={photo} size="sm" />
                        <span className="font-medium">{line.service_name}</span>
                      </div>
                    </td>
                    <td className="py-2 pr-2 text-right tabular-nums">{line.quantity}</td>
                    <td className="py-2 pr-2 text-right tabular-nums">
                      ₹{moneyInr(line.unit_price_inr)}
                    </td>
                    <td className="py-2 text-right font-medium tabular-nums">
                      ₹{moneyInr(line.line_total_inr)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="ml-auto mt-4 w-full max-w-xs space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="tabular-nums">₹{moneyInr(payload.subtotal_inr)}</span>
          </div>
          {delivery > 0 ? (
            <div className="flex justify-between">
              <span>Delivery</span>
              <span className="tabular-nums">₹{moneyInr(payload.delivery_fee_inr)}</span>
            </div>
          ) : null}
          <div className="flex justify-between" data-testid="invoice-cgst">
            <span>{formatGstLineLabel('CGST', payload.gst_rate)}</span>
            <span className="tabular-nums">₹{moneyInr(payload.cgst_inr)}</span>
          </div>
          <div className="flex justify-between" data-testid="invoice-sgst">
            <span>{formatGstLineLabel('SGST', payload.gst_rate)}</span>
            <span className="tabular-nums">₹{moneyInr(payload.sgst_inr)}</span>
          </div>
          <div
            className="flex items-end justify-between border-t-2 border-black pt-2"
            data-testid="invoice-total"
          >
            <span className="font-extrabold">TOTAL</span>
            <span className="text-4xl font-extrabold leading-none tabular-nums">
              ₹{moneyInr(payload.total_inr)}
            </span>
          </div>
        </div>

        <p className="mt-6 text-xs text-neutral-500">
          Amounts are frozen at order create. Reprint does not recalculate GST. CGST ₹
          {moneyInr(payload.cgst_inr)} · SGST ₹{moneyInr(payload.sgst_inr)} · Total ₹
          {moneyInr(payload.total_inr)}
        </p>
      </article>
    </div>
  );
}
