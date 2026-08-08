'use client';

import Link from 'next/link';
import { FileText, Printer, Tag } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type PrintOrderActionsProps = {
  orderId: string;
  className?: string;
  size?: 'sm' | 'default';
  /** Compact row for lists; default shows all three jobs. */
  showTags?: boolean;
  showBill?: boolean;
  showInvoice?: boolean;
};

export function PrintOrderActions({
  orderId,
  className,
  size = 'sm',
  showTags = true,
  showBill = true,
  showInvoice = true,
}: PrintOrderActionsProps) {
  const btnClass = size === 'sm' ? 'min-h-11 gap-1.5' : 'min-h-14 gap-2 text-base';
  return (
    <div
      className={cn('flex flex-wrap items-center gap-2', className)}
      data-testid="print-order-actions"
    >
      {showTags ? (
        <Button type="button" size={size} variant="outline" className={btnClass} asChild>
          <Link href={`/partner/floor/print/${orderId}/tags`} data-testid="print-tags-link">
            <Tag className="h-4 w-4" aria-hidden />
            Print Tags
          </Link>
        </Button>
      ) : null}
      {showBill ? (
        <Button type="button" size={size} variant="outline" className={btnClass} asChild>
          <Link href={`/partner/floor/print/${orderId}/bill`} data-testid="print-bill-link">
            <Printer className="h-4 w-4" aria-hidden />
            Print Bill
          </Link>
        </Button>
      ) : null}
      {showInvoice ? (
        <Button type="button" size={size} variant="outline" className={btnClass} asChild>
          <Link
            href={`/partner/floor/print/${orderId}/invoice`}
            data-testid="print-gst-invoice-link"
          >
            <FileText className="h-4 w-4" aria-hidden />
            Print GST Invoice
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
