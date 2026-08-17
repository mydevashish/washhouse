'use client';

import { Minus, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatInr } from '@/features/discover/detail/order-pricing';
import { cn } from '@/lib/utils';

export type PartnerNewOrderLineRow = {
  service_id: string;
  name: string;
  quantity: number;
  rate: number;
  amount: number;
  kind?: 'weight' | 'dry_clean' | 'press';
};

type Props = {
  rows: PartnerNewOrderLineRow[];
  emptyMessage?: string;
  onSetQty: (serviceId: string, quantity: number) => void;
  onSetRate?: (serviceId: string, rate: number) => void;
  onRemove: (serviceId: string) => void;
  className?: string;
};

export function PartnerNewOrderLineItemsTable({
  rows,
  emptyMessage = 'Add services from the grid above.',
  onSetQty,
  onSetRate,
  onRemove,
  className,
}: Props) {
  if (rows.length === 0) {
    return (
      <p className={cn('px-4 py-6 text-center text-sm text-muted-foreground', className)}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-sm">
        <thead className="border-b border-border/60 bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-2 font-semibold">Item</th>
            <th className="px-4 py-2 font-semibold">Qty</th>
            <th className="px-4 py-2 font-semibold">Rate</th>
            <th className="px-4 py-2 font-semibold">Amount</th>
            <th className="px-4 py-2 font-semibold">
              <span className="sr-only">Remove</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {rows.map((row) => (
            <tr key={row.service_id}>
              <td className="px-4 py-2 font-medium">{row.name}</td>
              <td className="px-4 py-2">
                <div className="inline-flex items-center gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 shrink-0"
                    aria-label={`Decrease quantity for ${row.name}`}
                    onClick={() => onSetQty(row.service_id, row.quantity - 1)}
                  >
                    <Minus className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                  <span className="min-w-[2ch] text-center tabular-nums">{row.quantity}</span>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 shrink-0"
                    aria-label={`Increase quantity for ${row.name}`}
                    onClick={() => onSetQty(row.service_id, row.quantity + 1)}
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                </div>
              </td>
              <td className="px-4 py-2">
                {onSetRate ? (
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={row.rate}
                    onChange={(event) => onSetRate(row.service_id, Number(event.target.value || 0))}
                    className="w-24 rounded-md border border-border bg-background px-2 py-1 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/30"
                    aria-label={`Adjust rate for ${row.name}`}
                  />
                ) : (
                  <span className="tabular-nums">{formatInr(row.rate)}</span>
                )}
              </td>
              <td className="px-4 py-2 tabular-nums font-medium">{formatInr(row.amount)}</td>
              <td className="px-4 py-2 text-right">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="text-danger"
                  aria-label={`Remove ${row.name}`}
                  onClick={() => onRemove(row.service_id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
