'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Loader2, Printer } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { QueryErrorState } from '@/components/feedback/query-error-state';
import { CatalogGarmentThumb } from '@/features/laundry-price-list/components/catalog-garment-thumb';
import { ColorTokenChip } from '@/features/partner-shop-floor/components/color-token-chip';
import { usePartnerFloorVoice } from '@/features/partner-shop-floor/hooks/use-partner-floor-voice';
import {
  formatGstLineLabel,
  moneyInr,
} from '@/features/partner-shop-floor/lib/invoice-display';
import { FLOOR_VOICE_PRINT_BILL } from '@/features/partner-shop-floor/lib/floor-voice';
import { resolveOrderLinePhoto } from '@/features/partner-shop-floor/lib/order-line-photo';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { getPartnerOrderInvoice } from '@/services/partner-order-invoice';
import { cn } from '@/lib/utils';

type PrintOrderBillViewProps = {
  orderId: string;
};

export function PrintOrderBillView({ orderId }: PrintOrderBillViewProps) {
  const { speak, hydrated } = usePartnerFloorVoice();
  const spokenRef = useRef(false);

  useEffect(() => {
    if (!hydrated || spokenRef.current) return;
    spokenRef.current = true;
    speak(FLOOR_VOICE_PRINT_BILL);
  }, [hydrated, speak]);

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
        Loading bill…
      </div>
    );
  }

  if (invoiceQ.isError || !payload) {
    return (
      <QueryErrorState
        title="Could not load bill"
        message={getApiErrorMessage(invoiceQ.error, 'Invoice unavailable')}
        onRetry={() => void invoiceQ.refetch()}
        isRetrying={invoiceQ.isFetching}
      />
    );
  }

  return (
    <div
      data-testid="print-order-bill"
      data-print-format="thermal"
      className="mx-auto max-w-md space-y-4 p-4 print:max-w-none print:p-0"
    >
      <style>{`
        @media print {
          @page { size: 58mm auto; margin: 2mm; }
        }
      `}</style>

      <div className="no-print space-y-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm text-muted-foreground">Counter bill (thermal)</p>
            {payload.token_code ? (
              <ColorTokenChip
                colorToken={payload.color_token}
                tokenCode={payload.token_code}
                size="lg"
                showLabel
              />
            ) : null}
          </div>
          <Button
            type="button"
            className="min-h-12 gap-2"
            onClick={() => window.print()}
            aria-label="Print bill"
          >
            <Printer className="h-5 w-5" aria-hidden />
            Print
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="ghost" size="sm" asChild>
            <Link href={`/partner/floor/print/${orderId}/invoice`}>GST Invoice</Link>
          </Button>
          <Button type="button" variant="ghost" size="sm" asChild>
            <Link href="/partner/floor/print">Print center</Link>
          </Button>
        </div>
      </div>

      <article
        className={cn(
          'print-bill-sheet bill-card overflow-hidden rounded-xl border border-border bg-white text-black shadow-sm',
          'print:rounded-none print:border-0 print:shadow-none',
        )}
      >
        <div className="space-y-2 p-4 text-center print:p-[3mm]">
          <h1 className="text-base font-bold leading-tight">{payload.laundry_name}</h1>
          {payload.laundry_address ? (
            <p className="text-[11px] text-neutral-600">{payload.laundry_address}</p>
          ) : null}
          <p className="text-xs">
            {payload.customer_name} · …{payload.customer_phone_last4}
          </p>
          {payload.token_code ? (
            <div className="flex justify-center py-1">
              <ColorTokenChip
                colorToken={payload.color_token}
                tokenCode={payload.token_code}
                size="md"
                showLabel
              />
            </div>
          ) : null}
        </div>

        <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
          {payload.lines.map((line, idx) => {
            const photo = resolveOrderLinePhoto(line.service_name);
            return (
              <li
                key={`${line.service_name}-${idx}`}
                className="flex items-start gap-2 px-3 py-2"
                data-testid="bill-line"
              >
                <CatalogGarmentThumb photo={photo} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium leading-snug">{line.service_name}</p>
                  <p className="text-[11px] text-neutral-600">
                    {line.quantity} × ₹{moneyInr(line.unit_price_inr)}
                  </p>
                </div>
                <p className="shrink-0 text-xs font-semibold tabular-nums">
                  ₹{moneyInr(line.line_total_inr)}
                </p>
              </li>
            );
          })}
        </ul>

        <div className="space-y-1 p-4 text-xs print:p-[3mm]">
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
          <div className="flex justify-between" data-testid="bill-cgst">
            <span>{formatGstLineLabel('CGST', payload.gst_rate)}</span>
            <span className="tabular-nums">₹{moneyInr(payload.cgst_inr)}</span>
          </div>
          <div className="flex justify-between" data-testid="bill-sgst">
            <span>{formatGstLineLabel('SGST', payload.gst_rate)}</span>
            <span className="tabular-nums">₹{moneyInr(payload.sgst_inr)}</span>
          </div>
          <div
            className="flex items-end justify-between border-t-2 border-black pt-2"
            data-testid="bill-total"
          >
            <span className="text-sm font-extrabold">TOTAL</span>
            <span className="text-3xl font-extrabold leading-none tabular-nums print:text-[22px]">
              ₹{moneyInr(payload.total_inr)}
            </span>
          </div>
          <p className="pt-2 text-center font-mono text-[11px]" data-testid="bill-invoice-number">
            Inv {payload.invoice_number}
          </p>
          <p className="text-center font-mono text-[10px] text-neutral-600">
            #{payload.tracking_code}
          </p>
        </div>
      </article>
    </div>
  );
}
