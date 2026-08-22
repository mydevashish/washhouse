'use client';

import Link from 'next/link';
import { FileText, Printer, Tag } from 'lucide-react';

import {
  buildPartnerPrintPath,
  canPrintBillOrInvoice,
  type PrintLifecycleEmphasis,
} from '@/features/partner-shop-floor/lib/print-lifecycle';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type PrintOrderActionsProps = {
  orderId: string;
  /** When set, bill / GST invoice default to handover statuses only. */
  orderStatus?: string | null;
  className?: string;
  size?: 'sm' | 'default';
  /** Compact icon row for hub lists. */
  layout?: 'default' | 'compact';
  /** Which job gets primary styling (detail / ready handover). */
  emphasize?: PrintLifecycleEmphasis | null;
  /** Compact row for lists; default shows all three jobs. */
  showTags?: boolean;
  showBill?: boolean;
  showInvoice?: boolean;
};

export function PrintOrderActions({
  orderId,
  orderStatus,
  className,
  size = 'sm',
  layout = 'default',
  emphasize = null,
  showTags = true,
  showBill,
  showInvoice,
}: PrintOrderActionsProps) {
  const handoverPrint = orderStatus !== undefined ? canPrintBillOrInvoice(orderStatus) : true;
  const showBillResolved = showBill ?? handoverPrint;
  const showInvoiceResolved = showInvoice ?? handoverPrint;
  const btnClass = size === 'sm' ? 'h-9 gap-1.5' : 'min-h-12 gap-2 text-base';
  const compactClass = 'h-8 w-8 px-0';

  if (layout === 'compact') {
    return (
      <div
        className={cn('flex flex-wrap items-center gap-1', className)}
        data-testid="print-order-actions"
        data-layout="compact"
        data-emphasize={emphasize ?? undefined}
      >
        {showTags ? (
          <Button
            type="button"
            size="sm"
            variant={emphasize === 'tags' ? 'default' : 'outline'}
            className={compactClass}
            asChild
          >
            <Link
              href={buildPartnerPrintPath(orderId, 'tags')}
              aria-label="Print tags"
              data-testid="print-tags-link"
              title="Print tags"
            >
              <Tag className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        ) : null}
        {showBillResolved ? (
          <Button
            type="button"
            size="sm"
            variant={emphasize === 'bill' ? 'default' : 'outline'}
            className={compactClass}
            asChild
          >
            <Link
              href={buildPartnerPrintPath(orderId, 'bill')}
              aria-label="Print counter bill"
              data-testid="print-bill-link"
              title="Print counter bill"
            >
              <Printer className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        ) : null}
        {showInvoiceResolved ? (
          <Button type="button" size="sm" variant="outline" className={compactClass} asChild>
            <Link
              href={buildPartnerPrintPath(orderId, 'invoice')}
              aria-label="Print invoice"
              data-testid="print-gst-invoice-link"
              title="Print invoice"
            >
              <FileText className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn('flex flex-wrap items-center gap-2', className)}
      data-testid="print-order-actions"
      data-emphasize={emphasize ?? undefined}
    >
      {showTags ? (
        <Button
          type="button"
          size={size}
          variant={emphasize === 'tags' ? 'default' : 'outline'}
          className={btnClass}
          asChild
        >
          <Link href={buildPartnerPrintPath(orderId, 'tags')} data-testid="print-tags-link">
            <Tag className="h-4 w-4" aria-hidden />
            Print tags
          </Link>
        </Button>
      ) : null}
      {showInvoiceResolved ? (
        <Button type="button" size={size} variant="outline" className={btnClass} asChild>
          <Link
            href={buildPartnerPrintPath(orderId, 'invoice')}
            data-testid="print-gst-invoice-link"
          >
            <FileText className="h-4 w-4" aria-hidden />
            Print invoice
          </Link>
        </Button>
      ) : null}
      {showBillResolved ? (
        <Button
          type="button"
          size={size}
          variant={emphasize === 'bill' ? 'default' : 'outline'}
          className={btnClass}
          asChild
        >
          <Link href={buildPartnerPrintPath(orderId, 'bill')} data-testid="print-bill-link">
            <Printer className="h-4 w-4" aria-hidden />
            Print counter bill
          </Link>
        </Button>
      ) : null}      
    </div>
  );
}
