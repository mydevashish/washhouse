'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Plus, Store, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { InfoBanner } from '@/components/ui/info-banner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  assistedOrderFormSchema,
  parseItemSummary,
  type AssistedOrderFormValues,
} from '@/features/partner/customer-desk/schemas';
import { usePartnerAssistedOrderMutations } from '@/features/partner/customer-desk/hooks';
import { buildWalkInPrefillHref } from '@/features/partner/customer-desk/phone';
import type {
  AssistedOrderCreatePayload,
  AssistedOrderCreateResult,
  CustomerDeskProfile,
  ReorderPrefill,
} from '@/features/partner/customer-desk/types';
import { usePartnerAnalytics } from '@/features/partner/hooks/use-partner-operations';
import {
  PartnerCustomerSnapshotCards,
  PartnerNewOrderLineItemsTable,
  PartnerNewOrderPrintHintCard,
  PartnerNewOrderServiceAddDialog,
  PartnerOpsSectionLabel,
  PartnerOpsSurface,
  PartnerServiceTile,
  type PartnerCustomerSnapshotStats,
} from '@/features/partner/components/ops-visual';
import { formatInr } from '@/features/discover/detail/order-pricing';
import { listAllPartnerServices } from '@/services/partner-service-catalog';
import type { ServiceCatalogItem } from '@/services/partner-service-catalog';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';

type Props = {
  profile: CustomerDeskProfile;
  reorder?: ReorderPrefill | null;
  onCreateBookingRequest: () => void;
  onCreated?: (result: AssistedOrderCreateResult) => void;
  layout?: 'default' | 'ops';
  insightStats?: PartnerCustomerSnapshotStats | null;
};

function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultSlots() {
  const pickup = new Date();
  pickup.setHours(pickup.getHours() + 2, 0, 0, 0);
  const delivery = new Date(pickup);
  delivery.setDate(delivery.getDate() + 1);
  delivery.setHours(18, 0, 0, 0);
  return {
    pickup_at: toDatetimeLocalValue(pickup),
    delivery_at: toDatetimeLocalValue(delivery),
  };
}

export function PartnerCustomerDeskPlaceOrderForm({
  profile,
  reorder = null,
  onCreateBookingRequest,
  onCreated,
  layout = 'default',
  insightStats = null,
}: Props) {
  const isOps = layout === 'ops';
  const slots = defaultSlots();
  const { createM } = usePartnerAssistedOrderMutations({ onCreated });
  const analyticsQ = usePartnerAnalytics();
  const laundryId = analyticsQ.data?.laundry_id ?? '';
  const laundryName = analyticsQ.data?.laundry_name ?? 'Your laundry';
  const [reorderWarnings, setReorderWarnings] = useState<string[]>([]);
  const [dialogService, setDialogService] = useState<ServiceCatalogItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const servicesQ = useQuery({
    queryKey: queryKeys.partnerServiceCatalog(),
    queryFn: listAllPartnerServices,
    staleTime: 60_000,
  });
  const services = useMemo(
    () =>
      (servicesQ.data ?? []).filter(
        (s) => s.is_active && (s.catalog_status ?? 'active') === 'active',
      ),
    [servicesQ.data],
  );

  const form = useForm<AssistedOrderFormValues>({
    resolver: zodResolver(assistedOrderFormSchema),
    defaultValues: {
      customer_name: profile.name ?? '',
      phone: profile.phone,
      laundry_id: laundryId || '00000000-0000-4000-8000-000000000000',
      address_line1: '',
      address_line2: '',
      address_city: '',
      address_pincode: '',
      address_landmark: '',
      pickup_at: slots.pickup_at,
      delivery_at: slots.delivery_at,
      notes: '',
      items: [{ service_id: '', quantity: 1 }],
    },
  });

  useEffect(() => {
    if (laundryId) form.setValue('laundry_id', laundryId);
  }, [laundryId, form]);

  useEffect(() => {
    form.reset({
      ...form.getValues(),
      customer_name: profile.name ?? form.getValues('customer_name'),
      phone: profile.phone,
      laundry_id: laundryId || form.getValues('laundry_id'),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.phone, profile.name, laundryId]);

  useEffect(() => {
    if (!reorder || !services.length) return;
    const parsed = parseItemSummary(reorder.itemSummary);
    const matched: { service_id: string; quantity: number }[] = [];
    const warnings: string[] = [];
    for (const line of parsed) {
      const svc = services.find(
        (s) => s.name.trim().toLowerCase() === line.name.trim().toLowerCase(),
      );
      if (svc) {
        matched.push({ service_id: svc.id, quantity: line.quantity });
      } else {
        warnings.push(`“${line.name}” is no longer in your catalog`);
      }
    }
    setReorderWarnings(warnings);
    if (matched.length) {
      form.setValue('items', matched);
    } else {
      form.setValue('items', [{ service_id: '', quantity: 1 }]);
      if (parsed.length) {
        setReorderWarnings([
          ...warnings,
          'Catalog changed — pick services manually',
        ]);
      }
    }
    const note = `Reorder from #${reorder.trackingCode}`;
    const existing = form.getValues('notes')?.trim() ?? '';
    if (!existing.includes(note)) {
      form.setValue('notes', existing ? `${existing}\n${note}` : note);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reorder?.orderId, services]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedItems = form.watch('items');

  const lineRows = useMemo(() => {
    return watchedItems
      .filter((item) => item.service_id)
      .map((item) => {
        const svc = services.find((s) => s.id === item.service_id);
        const rate = Number(svc?.price_inr ?? 0);
        const quantity = Number(item.quantity) || 1;
        return {
          service_id: item.service_id,
          name: svc?.name ?? 'Service',
          quantity,
          rate,
          amount: rate * quantity,
        };
      });
  }, [watchedItems, services]);

  const subtotal = lineRows.reduce((sum, row) => sum + row.amount, 0);

  const walkInHref = buildWalkInPrefillHref(profile.phone, profile.name);

  function addAssistedService(serviceId: string, qty: number) {
    const items = form.getValues('items');
    const idx = items.findIndex((i) => i.service_id === serviceId);
    if (idx >= 0) {
      const current = Number(items[idx]?.quantity) || 0;
      form.setValue(`items.${idx}.quantity`, current + qty);
      return;
    }
    const emptyIdx = items.findIndex((i) => !i.service_id);
    if (emptyIdx >= 0) {
      form.setValue(`items.${emptyIdx}.service_id`, serviceId);
      form.setValue(`items.${emptyIdx}.quantity`, qty);
    } else {
      append({ service_id: serviceId, quantity: qty });
    }
  }

  function setAssistedLineQty(serviceId: string, quantity: number) {
    const items = form.getValues('items');
    const idx = items.findIndex((i) => i.service_id === serviceId);
    if (idx < 0) return;
    if (quantity < 1) {
      remove(idx);
      if (form.getValues('items').length === 0) {
        append({ service_id: '', quantity: 1 });
      }
    } else {
      form.setValue(`items.${idx}.quantity`, quantity);
    }
  }

  function onSubmit(values: AssistedOrderFormValues) {
    if (!laundryId) {
      return;
    }
    const payload: AssistedOrderCreatePayload = {
      phone: values.phone,
      customer_name: values.customer_name,
      laundry_id: laundryId,
      address: {
        line1: values.address_line1,
        line2: values.address_line2 || undefined,
        city: values.address_city,
        pincode: values.address_pincode,
        landmark: values.address_landmark || undefined,
      },
      pickup_at: new Date(values.pickup_at).toISOString(),
      delivery_at: new Date(values.delivery_at).toISOString(),
      items: values.items.map((i) => ({
        service_id: i.service_id,
        quantity: i.quantity,
      })),
      notes: values.notes || undefined,
      payment_method: 'cod',
      reorder_from_order_id: reorder?.orderId ?? null,
      save_address_to_user: false,
    };
    const idempotencyKey =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `desk-${Date.now()}`;
    createM.mutate({ payload, idempotencyKey });
  }

  const banners = (
    <>
      <InfoBanner variant="default" title="Doorstep pickup">
        Creates an assisted doorstep order for <strong>{laundryName}</strong> (not walk-in).
        Payment defaults to COD.
      </InfoBanner>
      {reorder ? (
        <InfoBanner variant="default" title={`Order same as last time (#${reorder.trackingCode})`}>
          Prefilling services from the past order. Prices refresh from your current catalog — edit
          before saving.
          {reorderWarnings.length ? (
            <ul className="mt-1 list-disc pl-4 text-xs">
              {reorderWarnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          ) : null}
        </InfoBanner>
      ) : null}
    </>
  );

  const customerFields = (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="partner-desk-customer-name">Customer name</Label>
        <Input
          id="partner-desk-customer-name"
          autoComplete="name"
          className={isOps ? 'h-9 min-h-9' : undefined}
          {...form.register('customer_name')}
        />
        {form.formState.errors.customer_name ? (
          <p className="text-sm text-danger" role="alert">
            {form.formState.errors.customer_name.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="partner-desk-phone">Phone</Label>
        <Input
          id="partner-desk-phone"
          className={isOps ? 'h-9 min-h-9 font-mono' : 'font-mono'}
          readOnly
          aria-readonly="true"
          {...form.register('phone')}
        />
      </div>
    </div>
  );

  const addressFieldset = (
    <fieldset
      className={
        isOps
          ? 'space-y-3 rounded-xl border border-border bg-muted/20 p-4'
          : 'space-y-3 rounded-lg border border-border/80 p-3'
      }
    >
      <legend className="px-1 text-sm font-medium">Pickup address</legend>
      <div className="space-y-1.5">
        <Label htmlFor="partner-desk-line1">Address line 1</Label>
        <Input id="partner-desk-line1" {...form.register('address_line1')} />
        {form.formState.errors.address_line1 ? (
          <p className="text-sm text-danger" role="alert">
            {form.formState.errors.address_line1.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="partner-desk-line2">Address line 2 (optional)</Label>
        <Input id="partner-desk-line2" {...form.register('address_line2')} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="partner-desk-city">City</Label>
          <Input id="partner-desk-city" {...form.register('address_city')} />
          {form.formState.errors.address_city ? (
            <p className="text-sm text-danger" role="alert">
              {form.formState.errors.address_city.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="partner-desk-pincode">Pincode</Label>
          <Input
            id="partner-desk-pincode"
            inputMode="numeric"
            maxLength={6}
            {...form.register('address_pincode')}
          />
          {form.formState.errors.address_pincode ? (
            <p className="text-sm text-danger" role="alert">
              {form.formState.errors.address_pincode.message}
            </p>
          ) : null}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="partner-desk-landmark">Landmark (optional)</Label>
        <Input id="partner-desk-landmark" {...form.register('address_landmark')} />
      </div>
    </fieldset>
  );

  const scheduleFields = (
    <div className={cn('grid gap-3', isOps ? 'grid-cols-1' : 'sm:grid-cols-2')}>
      <div className="space-y-1.5">
        <Label htmlFor="partner-desk-pickup">Pickup</Label>
        <Input
          id="partner-desk-pickup"
          type="datetime-local"
          className={isOps ? 'h-9 min-h-9' : undefined}
          {...form.register('pickup_at')}
        />
        {form.formState.errors.pickup_at ? (
          <p className="text-sm text-danger" role="alert">
            {form.formState.errors.pickup_at.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="partner-desk-delivery">Delivery</Label>
        <Input
          id="partner-desk-delivery"
          type="datetime-local"
          className={isOps ? 'h-9 min-h-9' : undefined}
          {...form.register('delivery_at')}
        />
        {form.formState.errors.delivery_at ? (
          <p className="text-sm text-danger" role="alert">
            {form.formState.errors.delivery_at.message}
          </p>
        ) : null}
      </div>
    </div>
  );

  const defaultServicesBlock = (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label>Services</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1 text-xs"
          onClick={() => append({ service_id: '', quantity: 1 })}
          disabled={!services.length}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Add line
        </Button>
      </div>
      {servicesQ.isLoading ? (
        <p className="text-xs text-muted-foreground">Loading services…</p>
      ) : services.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No active services — add them in your catalog first.
        </p>
      ) : null}
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-end"
        >
          <div className="min-w-0 flex-1 space-y-1.5">
            <Label htmlFor={`partner-desk-service-${index}`}>Service</Label>
            <Select
              id={`partner-desk-service-${index}`}
              {...form.register(`items.${index}.service_id`)}
              disabled={!services.length}
            >
              <option value="">Select service</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — ₹{s.price_inr}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-full space-y-1.5 sm:w-24">
            <Label htmlFor={`partner-desk-qty-${index}`}>Qty</Label>
            <Input
              id={`partner-desk-qty-${index}`}
              type="number"
              min={1}
              {...form.register(`items.${index}.quantity`)}
            />
          </div>
          {fields.length > 1 ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-danger"
              aria-label={`Remove service line ${index + 1}`}
              onClick={() => remove(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      ))}
      {form.formState.errors.items?.message || form.formState.errors.items?.root?.message ? (
        <p className="text-sm text-danger" role="alert">
          {form.formState.errors.items.message ?? form.formState.errors.items.root?.message}
        </p>
      ) : null}
    </div>
  );

  const opsServicesBlock = (
    <div className="space-y-3">
      <PartnerOpsSectionLabel>Services</PartnerOpsSectionLabel>
      {servicesQ.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading services…</p>
      ) : services.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No active services — add them in your catalog first.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((svc) => (
            <PartnerServiceTile
              key={svc.id}
              service={svc}
              onAdd={() => {
                setDialogService(svc);
                setDialogOpen(true);
              }}
            />
          ))}
        </div>
      )}
      <PartnerOpsSectionLabel>Line items</PartnerOpsSectionLabel>
      <div className="overflow-hidden rounded-xl border border-border">
        <PartnerNewOrderLineItemsTable
          rows={lineRows}
          emptyMessage="Add services from the tiles above."
          onSetQty={setAssistedLineQty}
          onRemove={(serviceId: string) => setAssistedLineQty(serviceId, 0)}
        />
      </div>
      {form.formState.errors.items?.message || form.formState.errors.items?.root?.message ? (
        <p className="text-sm text-danger" role="alert">
          {form.formState.errors.items.message ?? form.formState.errors.items.root?.message}
        </p>
      ) : null}
    </div>
  );

  const footerActions = (
    <div className="flex flex-col gap-2 border-t border-border/60 pt-3">
      <Button
        type="submit"
        className="min-h-[48px] w-full text-base"
        disabled={createM.isPending || !laundryId}
        aria-busy={createM.isPending}
      >
        {createM.isPending ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        ) : (
          'Place doorstep order'
        )}
      </Button>
      <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:justify-between">
        <Button asChild type="button" variant="outline" className="h-9 min-h-9 gap-1.5">
          <Link
            href={walkInHref}
            aria-label={`Record walk-in order for ${profile.name ?? profile.phone ?? 'customer'}`}
          >
            <Store className="h-4 w-4" aria-hidden />
            Record walk-in instead
          </Link>
        </Button>
        <Button
          type="button"
          variant="link"
          className="h-auto justify-start px-0 text-sm"
          onClick={onCreateBookingRequest}
        >
          Create booking request
        </Button>
      </div>
    </div>
  );

  const opsSummaryAside = (
    <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
      <PartnerOpsSurface variant="muted" className="space-y-4 !p-4">
        <div>
          <PartnerOpsSectionLabel as="h2">Order summary</PartnerOpsSectionLabel>
          <p className="mt-1 text-sm text-muted-foreground">Doorstep · COD</p>
        </div>
        <div className="space-y-3 rounded-xl border border-border bg-background/80 p-4">
          {scheduleFields}
          <div className="space-y-1.5">
            <Label htmlFor="partner-desk-notes">Notes (optional)</Label>
            <Textarea id="partner-desk-notes" rows={2} {...form.register('notes')} />
          </div>
          <div className="space-y-2 border-t border-border/60 pt-3 text-sm">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                {lineRows.length} service{lineRows.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Subtotal (catalog)</span>
              <span className="font-medium tabular-nums">{formatInr(subtotal)}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Delivery fee and GST are calculated when the order is saved.
            </p>
          </div>
        </div>
        <div className="rounded-xl bg-muted p-4">
          <div className="flex items-center justify-between text-base font-semibold">
            <span>Grand total (est.)</span>
            <span className="tabular-nums">{formatInr(subtotal)}</span>
          </div>
        </div>
        <Button
          type="submit"
          className="min-h-[48px] w-full text-base"
          disabled={createM.isPending || !laundryId}
          aria-busy={createM.isPending}
        >
          {createM.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          ) : (
            'Place doorstep order'
          )}
        </Button>
        <div className="flex flex-col gap-2">
          <Button asChild type="button" variant="outline" className="h-9 min-h-9 gap-1.5">
            <Link href={walkInHref}>
              <Store className="h-4 w-4" aria-hidden />
              Record walk-in instead
            </Link>
          </Button>
          <Button
            type="button"
            variant="link"
            className="h-auto justify-start px-0 text-sm"
            onClick={onCreateBookingRequest}
          >
            Create booking request
          </Button>
        </div>
      </PartnerOpsSurface>
      <PartnerNewOrderPrintHintCard />
    </aside>
  );

  if (isOps) {
    return (
      <form
        className="grid gap-3 xl:grid-cols-[1.55fr_0.95fr]"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        aria-label="Place assisted doorstep order"
      >
        <PartnerNewOrderServiceAddDialog
          service={dialogService}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onConfirm={(qty: number) => {
            if (dialogService) addAssistedService(dialogService.id, qty);
          }}
        />
        <PartnerOpsSurface className="space-y-4">
          <div className="space-y-1">
            <p className="text-lg font-semibold tracking-tight">New order / Create order</p>
            <p className="text-sm text-muted-foreground">
              Search customer and add services with popup entry.
            </p>
          </div>
          {banners}
          <div className="grid gap-4 rounded-xl border border-border bg-muted/40 p-4">
            <div>
              <p className="text-sm font-semibold">Search customer</p>
              <p className="text-xs text-muted-foreground">Profile from phone lookup.</p>
            </div>
            {customerFields}
            <PartnerCustomerSnapshotCards profile={profile} stats={insightStats} />
          </div>
          {addressFieldset}
          {opsServicesBlock}
        </PartnerOpsSurface>
        {opsSummaryAside}
      </form>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      aria-label="Place assisted doorstep order"
    >
      {banners}
      {customerFields}
      {addressFieldset}
      {scheduleFields}
      {defaultServicesBlock}
      <div className="space-y-1.5">
        <Label htmlFor="partner-desk-notes-default">Notes (optional)</Label>
        <Textarea id="partner-desk-notes-default" rows={2} {...form.register('notes')} />
      </div>
      {footerActions}
    </form>
  );
}
