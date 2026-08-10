'use client';

import Link from 'next/link';
import { Barcode } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatInr } from '@/features/discover/detail/order-pricing';
import { ColorTokenChip } from '@/features/partner-shop-floor/components/color-token-chip';
import { PrintOrderActions } from '@/features/partner-shop-floor/components/print-order-actions';
import { buildPartnerPrintPath, canPrintBillOrInvoice } from '@/features/partner-shop-floor/lib/print-lifecycle';
import type { PartnerNewOrderLineRow } from '@/features/partner/components/ops-visual/partner-new-order-line-items-table';
import { PartnerOpsSectionLabel } from '@/features/partner/components/ops-visual/partner-ops-section-label';
import type { WalkInOrder } from '@/services/partner-walk-in-orders';

export type PartnerOrderWorkspaceCustomer = {
  name: string;
  phone: string;
  address?: string | null;
};

type Props = {
  order: WalkInOrder | null;
  customer: PartnerOrderWorkspaceCustomer;
  lineRows: PartnerNewOrderLineRow[];
  paymentMethod: string;
  deliveryType: string;
  estimatedGrandTotal: number;
  onCreateAnother?: () => void;
};

function formatOrderDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function statusLabel(status: string | undefined): string {
  if (!status) return '—';
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function PartnerOrderWorkspacePanels({
  order,
  customer,
  lineRows,
  paymentMethod,
  deliveryType,
  estimatedGrandTotal,
  onCreateAnother,
}: Props) {
  const tracking = order?.tracking_code ?? '—';
  const totalDisplay = order ? Number(order.total_inr) : estimatedGrandTotal;
  const handoverPrint = order ? canPrintBillOrInvoice(order.status) : false;
  const serviceSummary =
    lineRows.length > 0
      ? lineRows
          .slice(0, 2)
          .map((r) => r.name)
          .join(' + ')
      : 'Add services above';
  const itemQty = lineRows.reduce((s, r) => s + r.quantity, 0);

  return (
    <>
      <section className="grid gap-5 xl:grid-cols-[1.55fr_0.95fr]">
        <Card className="border-border xl:col-span-1">
          <CardHeader>
            <CardTitle>Invoice &amp; tags</CardTitle>
            <CardDescription>
              {order
                ? 'Print tags and invoice after the order is saved.'
                : 'Invoice number appears after you create the order.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl border border-border bg-background p-4">
              <PartnerOpsSectionLabel as="span">Tracking / invoice ref</PartnerOpsSectionLabel>
              <p className="mt-2 font-semibold">{order ? `#${tracking}` : '—'}</p>
              {order?.token_code ? (
                <div className="mt-2">
                  <ColorTokenChip
                    colorToken={order.color_token}
                    tokenCode={order.token_code}
                    size="md"
                    showLabel
                  />
                </div>
              ) : null}
              <p className="mt-1 text-sm text-muted-foreground">
                Total {formatInr(totalDisplay)}
              </p>
            </div>
            {order ? (
              <div className="grid gap-3">
                {handoverPrint ? (
                  <Button type="button" size="sm" variant="outline" asChild>
                    <Link href={buildPartnerPrintPath(order.id, 'invoice')}>Download invoice PDF</Link>
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Bill and GST invoice unlock when the order is ready for handover.
                  </p>
                )}
                <Button type="button" size="sm" variant="secondary" asChild>
                  <Link href={buildPartnerPrintPath(order.id, 'tags')}>Print tag / label</Link>
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Create the order to unlock print actions.
              </p>
            )}
          </CardContent>
        </Card>

        {order ? (
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Order saved</CardTitle>
              <CardDescription>Tags and invoice are ready from your print routes.</CardDescription>
            </CardHeader>
            <CardContent>
              <PrintOrderActions orderId={order.id} orderStatus={order.status} className="flex-wrap" />
            </CardContent>
            {onCreateAnother ? (
              <CardFooter>
                <Button type="button" variant="outline" size="sm" onClick={onCreateAnother}>
                  Create another order
                </Button>
              </CardFooter>
            ) : null}
          </Card>
        ) : null}
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Order details &amp; status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-muted/40 p-4">
                <PartnerOpsSectionLabel as="span">Customer details</PartnerOpsSectionLabel>
                <p className="mt-2 font-semibold">{customer.name || '—'}</p>
                <p className="text-sm">{customer.phone || '—'}</p>
                {customer.address ? <p className="text-sm text-muted-foreground">{customer.address}</p> : null}
              </div>
              <div className="rounded-3xl bg-muted/40 p-4">
                <PartnerOpsSectionLabel as="span">Order information</PartnerOpsSectionLabel>
                <p className="mt-2 font-semibold">{order ? tracking : 'Draft'}</p>
                <p className="text-sm">{order ? formatOrderDate(order.pickup_at) : 'Not saved yet'}</p>
                <p className="text-sm">
                  Status: {order ? statusLabel(order.status) : 'Draft — add lines and save'}
                </p>
                <p className="text-sm text-muted-foreground">Logistics: {deliveryType}</p>
              </div>
            </div>
            <div className="overflow-hidden rounded-3xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No line items yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    lineRows.map((item) => (
                      <TableRow key={item.service_id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatInr(item.rate)}</TableCell>
                        <TableCell>{formatInr(item.amount)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Invoice</CardTitle>
            <CardDescription>GST invoice preview with bill summary.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl bg-muted/40 p-4">
              <PartnerOpsSectionLabel as="span">Invoice ref</PartnerOpsSectionLabel>
              <p className="mt-2 font-semibold">{order ? `#${tracking}` : '—'}</p>
              <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                <p>Order date: {order ? formatOrderDate(order.pickup_at).split(',')[0] : '—'}</p>
                <p>Payment method: {paymentMethod}</p>
              </div>
            </div>
            <div className="overflow-hidden rounded-3xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineRows.slice(0, 6).map((item) => (
                    <TableRow key={item.service_id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatInr(item.rate)}</TableCell>
                      <TableCell>{formatInr(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3}>Grand total</TableCell>
                    <TableCell>{formatInr(totalDisplay)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </CardContent>
          {order ? (
            <CardFooter className="justify-end gap-2">
              <Button type="button" variant="outline" size="sm" asChild>
                <Link href={buildPartnerPrintPath(order.id, 'invoice')}>Download PDF</Link>
              </Button>
              <Button type="button" size="sm" variant="secondary" asChild>
                <Link href={buildPartnerPrintPath(order.id, 'bill')}>Print invoice</Link>
              </Button>
            </CardFooter>
          ) : null}
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Tag / Label printing</CardTitle>
            <CardDescription>Bag and garment label preview — print opens your tag route.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[30px] border border-border bg-background p-5 text-sm shadow-sm">
                <PartnerOpsSectionLabel as="span">Bag tag</PartnerOpsSectionLabel>
                <div className="mt-4 space-y-3">
                  <p className="font-semibold text-foreground">{order ? tracking : '—'}</p>
                  <p>{customer.name || 'Customer'}</p>
                  <p className="text-sm text-muted-foreground">{serviceSummary}</p>
                  <p className="text-sm text-muted-foreground">
                    {deliveryType} · {itemQty || 0} items
                  </p>
                  <div className="flex h-24 items-center justify-center rounded-2xl bg-muted/50">
                    <Barcode className="h-16 w-16 text-muted-foreground" aria-hidden />
                  </div>
                </div>
              </div>
              <div className="rounded-[30px] border border-border bg-background p-5 text-sm shadow-sm">
                <PartnerOpsSectionLabel as="span">Garment tag</PartnerOpsSectionLabel>
                <div className="mt-4 space-y-3">
                  <p className="font-semibold text-foreground">
                    {lineRows[0]?.name ?? 'Service'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {lineRows[0] ? `${lineRows[0].quantity} pcs` : 'Qty —'}
                  </p>
                  <p className="text-sm text-muted-foreground">Customer: {customer.name || '—'}</p>
                  <div className="flex h-24 items-center justify-center rounded-2xl bg-muted/50">
                    <Barcode className="h-16 w-16 text-muted-foreground" aria-hidden />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            {order ? (
              <>
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link href={buildPartnerPrintPath(order.id, 'tags')}>Print tag</Link>
                </Button>
                <Button type="button" size="sm" asChild>
                  <Link href={buildPartnerPrintPath(order.id, 'tags')}>Reprint label</Link>
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Save the order to print labels.</p>
            )}
          </CardFooter>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Delivery dispatch</CardTitle>
            <CardDescription>
              {order
                ? 'Pickup and delivery windows from the saved order.'
                : 'Dispatch details appear after the order is created.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-3xl bg-muted/40 p-4">
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Order</span>
                  <Badge variant="secondary">{order ? statusLabel(order.status) : 'Draft'}</Badge>
                </div>
                <p className="text-sm">
                  Pickup: {order ? formatOrderDate(order.pickup_at) : 'Set when order is saved'}
                </p>
                <p className="text-sm">
                  Delivery: {order ? formatOrderDate(order.delivery_at) : 'Set when order is saved'}
                </p>
                {order?.partner_notes ? (
                  <div className="rounded-3xl bg-background p-4 text-sm">
                    <p className="font-semibold">Delivery note</p>
                    <p className="mt-2 text-muted-foreground">{order.partner_notes}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </CardContent>
          {order ? (
            <CardFooter>
              <Button type="button" variant="outline" size="sm" asChild>
                <Link href={`/partner/orders/${order.id}`}>Open order detail</Link>
              </Button>
            </CardFooter>
          ) : null}
        </Card>
      </section>
    </>
  );
}
