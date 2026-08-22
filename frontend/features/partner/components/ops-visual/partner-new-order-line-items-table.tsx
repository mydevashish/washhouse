 'use client';

import React from 'react';

import { Minus, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatInr } from '@/features/discover/detail/order-pricing';
import type { ClothWallLine } from '@/features/partner-shop-floor/lib/cloth-wall-qty';
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
  /** Optional weight rows to render as top-level weight services with sublists. */
  weightRows?: PartnerNewOrderLineRow[];
  /** Raw garment lines to show as sublists under weight services. */
  garmentLines?: ClothWallLine[];
  emptyMessage?: string;
  onSetQty: (serviceId: string, quantity: number) => void;
  onSetRate?: (serviceId: string, rate: number) => void;
  onRemove: (serviceId: string) => void;
  className?: string;
};

export function PartnerNewOrderLineItemsTable({
  rows,
  weightRows,
  garmentLines,
  emptyMessage = 'Add services from the grid above.',
  onSetQty,
  onSetRate,
  onRemove,
  className,
}: Props) {
  if (rows.length === 0 && (!weightRows || weightRows.length === 0)) {
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
          {/* If weightRows + garmentLines provided, render grouped by service */}
          {weightRows && garmentLines ? (
            <>
              {weightRows.map((row) => {
                const svcId = row.service_id.startsWith('service:') ? row.service_id.split(':')[1] : undefined;
                const items = svcId ? garmentLines.filter((l) => l.serviceId === svcId) : [];
                return (
                  <React.Fragment key={row.service_id}>
                    <tr>
                      <td className="px-4 py-2 font-medium">{row.name}</td>
                      <td className="px-4 py-2">
                        <span className="tabular-nums">{row.quantity}</span>
                      </td>
                      <td className="px-4 py-2">
                        {onSetRate ? (
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={row.rate === 0 ? '' : row.rate}
                            onChange={(event) => {
                              const raw = event.target.value.replace(/[^\d]/g, '');
                              onSetRate(row.service_id, Number(raw || 0));
                            }}
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

                    {items.length > 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-2">
                          <div className="mt-2 grid gap-2">
                            {items.map((l) => (
                              <div key={l.key} className="flex items-center justify-between text-sm text-muted-foreground">
                                <div>
                                  {l.label} {l.quantity ? <span className="text-muted-foreground">({l.quantity})</span> : null}
                                </div>
                                {/* Hide per-item pricing in the weight summary per request */}
                                <div />
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                );
              })}

              {/* Render remaining rows (dry_clean / press) from provided rows prop */}
              {rows.map((row) => (
                <tr key={row.service_id}>
                  <td className="px-4 py-2 font-medium">{row.name}</td>
                  <td className="px-4 py-2">{row.quantity}</td>
                  <td className="px-4 py-2 tabular-nums">
                    {onSetRate ? (
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={row.rate === 0 ? '' : row.rate}
                        onChange={(event) => {
                          const raw = event.target.value.replace(/[^\d]/g, '');
                          onSetRate(row.service_id, Number(raw || 0));
                        }}
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
            </>
          ) : (
            rows.map((row) => (
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
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={row.rate === 0 ? '' : row.rate}
                      onChange={(event) => {
                        const raw = event.target.value.replace(/[^\d]/g, '');
                        onSetRate(row.service_id, Number(raw || 0));
                      }}
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
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
