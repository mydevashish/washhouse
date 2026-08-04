'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Store, Trash2, Truck } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { PartnerPanel } from '@/features/partner/components/partner-panel';
import { PartnerCustomerDeskPlaceOrderForm } from '@/features/partner/customer-desk/components/partner-customer-desk-place-order-form';
import { usePartnerCustomerDeskLookup } from '@/features/partner/customer-desk/hooks';
import {
  isValidIndianMobileE164,
  normalizeIndianPhoneInput,
} from '@/features/partner/customer-desk/phone';
import { guestDeskProfile } from '@/features/partner/customer-desk/types';
import { usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';
import { formatInr } from '@/features/discover/detail/order-pricing';
import { buildOrdersHubPath } from '@/lib/navigation/orders-hub';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';
import { listPartnerServices } from '@/services/partner-service-catalog';
import { createWalkInOrder } from '@/services/partner-walk-in-orders';

type OrderMode = 'walk_in' | 'assisted';

type LineItem = { service_id: string; quantity: number };

export function PartnerNewOrderView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const enabled = usePartnerQueriesEnabled();
  const queryClient = useQueryClient();

  const modeParam = searchParams.get('mode');
  const phoneParam = searchParams.get('phone') ?? '';
  const nameParam = searchParams.get('name') ?? '';

  const initialMode: OrderMode =
    modeParam === 'assisted' ? 'assisted' : 'walk_in';

  const [mode, setMode] = useState<OrderMode>(initialMode);
  const [customerName, setCustomerName] = useState(nameParam);
  const [customerPhone, setCustomerPhone] = useState(phoneParam);
  const [notes, setNotes] = useState('');
  const [expectedReadyAt, setExpectedReadyAt] = useState('');
  const [items, setItems] = useState<LineItem[]>([]);
  const [assistedReady, setAssistedReady] = useState(false);
  const [lookupPhone, setLookupPhone] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (nameParam) setCustomerName(nameParam);
    if (phoneParam) setCustomerPhone(phoneParam);
  }, [nameParam, phoneParam]);

  useEffect(() => {
    if (mode === 'assisted' && phoneParam) {
      const normalized = normalizeIndianPhoneInput(phoneParam);
      if (isValidIndianMobileE164(normalized)) {
        setLookupPhone(normalized);
        setAssistedReady(true);
      }
    }
  }, [mode, phoneParam]);

  const servicesQ = useQuery({
    queryKey: queryKeys.partnerServiceCatalog(),
    queryFn: listPartnerServices,
    enabled,
  });

  const services = useMemo(
    () =>
      (servicesQ.data ?? []).filter(
        (s) => s.is_active && (s.catalog_status ?? 'active') === 'active',
      ),
    [servicesQ.data],
  );

  const lookupQ = usePartnerCustomerDeskLookup(
    lookupPhone ? { phone: lookupPhone } : null,
    Boolean(mode === 'assisted' && assistedReady && lookupPhone),
  );

  const profile = lookupQ.data ?? (lookupPhone ? guestDeskProfile(lookupPhone) : null);

  const createMutation = useMutation({
    mutationFn: createWalkInOrder,
    onSuccess: (order) => {
      toast.success(`Walk-in order #${order.tracking_code} created`);
      void queryClient.invalidateQueries({ queryKey: queryKeys.partnerWalkInOrders() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.partnerOrders() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.partnerAnalytics() });
      router.push(`/partner/orders/${order.id}`);
    },
    onError: () => toast.error('Could not save walk-in order'),
  });

  function addService(serviceId: string) {
    setItems((prev) => {
      const existing = prev.find((i) => i.service_id === serviceId);
      if (existing) {
        return prev.map((i) =>
          i.service_id === serviceId ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { service_id: serviceId, quantity: 1 }];
    });
  }

  function setQty(serviceId: string, quantity: number) {
    if (quantity < 1) {
      setItems((prev) => prev.filter((i) => i.service_id !== serviceId));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.service_id === serviceId ? { ...i, quantity } : i)),
    );
  }

  function removeLine(serviceId: string) {
    setItems((prev) => prev.filter((i) => i.service_id !== serviceId));
  }

  const lineRows = items.map((item) => {
    const svc = services.find((s) => s.id === item.service_id);
    const rate = Number(svc?.price_inr ?? 0);
    return {
      ...item,
      name: svc?.name ?? 'Service',
      rate,
      amount: rate * item.quantity,
    };
  });

  const subtotal = lineRows.reduce((sum, row) => sum + row.amount, 0);

  function submitWalkIn(e: React.FormEvent) {
    e.preventDefault();
    const phone = normalizeIndianPhoneInput(customerPhone);
    if (!customerName.trim()) {
      toast.error('Customer name is required');
      return;
    }
    if (!/^\+?[1-9]\d{9,14}$/.test(phone.replace(/\s/g, ''))) {
      toast.error('Enter a valid phone number');
      return;
    }
    if (!items.length) {
      toast.error('Add at least one service');
      return;
    }
    createMutation.mutate({
      customer_name: customerName.trim(),
      customer_phone: phone.startsWith('+') ? phone : `+${phone}`,
      items,
      notes: notes.trim() || undefined,
      expected_ready_at: expectedReadyAt || undefined,
    });
  }

  function startAssistedLookup() {
    const phone = normalizeIndianPhoneInput(customerPhone);
    if (!isValidIndianMobileE164(phone)) {
      toast.error('Use a valid Indian mobile (+91 and 10 digits starting 6–9)');
      return;
    }
    setLookupPhone(phone);
    setAssistedReady(true);
  }

  return (
    <PartnerContent className="space-y-4">
      <PartnerPageHeader
        title="New Order"
        description="Create a walk-in or doorstep assisted order"
        actions={
          <Button type="button" size="sm" variant="outline" asChild>
            <Link href={buildOrdersHubPath('/partner/orders', 'desk')}>Open desk</Link>
          </Button>
        }
      />

      <div
        className="flex w-fit rounded-lg bg-muted/60 p-0.5"
        role="tablist"
        aria-label="Order type"
      >
        {(
          [
            { id: 'walk_in' as const, label: 'Walk-in', icon: Store },
            { id: 'assisted' as const, label: 'Doorstep assisted', icon: Truck },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            onClick={() => {
              setMode(id);
              setAssistedReady(false);
              setLookupPhone(null);
            }}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              mode === id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      {mode === 'walk_in' ? (
        <form onSubmit={submitWalkIn} className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <PartnerPanel title="Customer" bodyClassName="space-y-3 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="no-name">Customer name</Label>
                  <Input
                    id="no-name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="no-phone">Phone (WhatsApp)</Label>
                  <Input
                    id="no-phone"
                    type="tel"
                    inputMode="tel"
                    placeholder="+91XXXXXXXXXX"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                  />
                </div>
              </div>
            </PartnerPanel>

            <PartnerPanel title="Select services" description="Tap + Add to build the bill" bodyClassName="p-4">
              {servicesQ.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading catalog…</p>
              ) : services.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active services. Add them in Service catalog.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {services.map((svc) => (
                    <div
                      key={svc.id}
                      className="flex flex-col rounded-lg bg-muted/30 p-3 ring-1 ring-border/50"
                    >
                      <p className="text-sm font-medium">{svc.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{svc.category}</p>
                      <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                        <span className="text-sm font-semibold tabular-nums">
                          {formatInr(Number(svc.price_inr))}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => addService(svc.id)}
                        >
                          <Plus className="h-3.5 w-3.5" aria-hidden />
                          Add
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </PartnerPanel>

            <PartnerPanel title="Itemized bill" bodyClassName="p-0">
              {lineRows.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                  Add services from the grid above.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border/60 bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2 font-semibold">Item</th>
                        <th className="px-4 py-2 font-semibold">Qty</th>
                        <th className="px-4 py-2 font-semibold">Rate</th>
                        <th className="px-4 py-2 font-semibold">Amount</th>
                        <th className="px-4 py-2 font-semibold" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {lineRows.map((row) => (
                        <tr key={row.service_id}>
                          <td className="px-4 py-2 font-medium">{row.name}</td>
                          <td className="px-4 py-2">
                            <Input
                              type="number"
                              min={1}
                              className="h-8 w-20"
                              value={row.quantity}
                              onChange={(e) => setQty(row.service_id, Number(e.target.value) || 1)}
                              aria-label={`Quantity for ${row.name}`}
                            />
                          </td>
                          <td className="px-4 py-2 tabular-nums">{formatInr(row.rate)}</td>
                          <td className="px-4 py-2 tabular-nums font-medium">
                            {formatInr(row.amount)}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="text-danger"
                              aria-label={`Remove ${row.name}`}
                              onClick={() => removeLine(row.service_id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </PartnerPanel>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <PartnerPanel title="Order summary" bodyClassName="space-y-3 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium tabular-nums">{formatInr(subtotal)}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Tax and final total are calculated when the order is saved.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="no-ready">Preferred ready time</Label>
                <Input
                  id="no-ready"
                  type="datetime-local"
                  value={expectedReadyAt}
                  onChange={(e) => setExpectedReadyAt(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="no-notes">Notes</Label>
                <Textarea
                  id="no-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <div className="border-t border-border/60 pt-3">
                <div className="flex justify-between text-base font-semibold">
                  <span>Estimated</span>
                  <span className="tabular-nums">{formatInr(subtotal)}</span>
                </div>
              </div>
              <Button
                type="submit"
                className="min-h-[44px] w-full"
                disabled={createMutation.isPending}
                aria-busy={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  'Create order'
                )}
              </Button>
            </PartnerPanel>
          </aside>
        </form>
      ) : (
        <div className="space-y-4">
          <PartnerPanel title="Find customer" bodyClassName="space-y-3 p-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <div className="space-y-1.5">
                <Label htmlFor="assisted-phone">Customer phone</Label>
                <Input
                  id="assisted-phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="+91XXXXXXXXXX"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  className="min-h-[40px] w-full sm:w-auto"
                  onClick={startAssistedLookup}
                  disabled={lookupQ.isFetching}
                >
                  {lookupQ.isFetching ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    'Continue'
                  )}
                </Button>
              </div>
            </div>
            {lookupQ.isError && (
              <p className="text-sm text-danger">Could not look up customer. You can still place as guest.</p>
            )}
          </PartnerPanel>

          {assistedReady && profile ? (
            <PartnerPanel title="Doorstep order" description={profile.name ?? profile.phone} bodyClassName="p-4">
              <PartnerCustomerDeskPlaceOrderForm
                profile={{
                  ...profile,
                  name: customerName.trim() || profile.name,
                }}
                onCreateBookingRequest={() =>
                  router.push(buildOrdersHubPath('/partner/orders', 'requests'))
                }
                onCreated={(trackingCode) => {
                  toast.success(`Order #${trackingCode} created`);
                  router.push('/partner/orders');
                }}
              />
            </PartnerPanel>
          ) : (
            <p className="text-sm text-muted-foreground">
              Enter the customer phone to load history and place a doorstep pickup/delivery order.
            </p>
          )}
        </div>
      )}
    </PartnerContent>
  );
}
