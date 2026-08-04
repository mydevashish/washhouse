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
  CustomerDeskProfile,
  ReorderPrefill,
} from '@/features/partner/customer-desk/types';
import { usePartnerAnalytics } from '@/features/partner/hooks/use-partner-operations';
import { listPartnerServices } from '@/services/partner-service-catalog';
import { queryKeys } from '@/lib/query-keys';

type Props = {
  profile: CustomerDeskProfile;
  reorder?: ReorderPrefill | null;
  onCreateBookingRequest: () => void;
  onCreated?: (trackingCode: string) => void;
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
}: Props) {
  const slots = defaultSlots();
  const { createM } = usePartnerAssistedOrderMutations({ onCreated });
  const analyticsQ = usePartnerAnalytics();
  const laundryId = analyticsQ.data?.laundry_id ?? '';
  const laundryName = analyticsQ.data?.laundry_name ?? 'Your laundry';
  const [reorderWarnings, setReorderWarnings] = useState<string[]>([]);

  const servicesQ = useQuery({
    queryKey: queryKeys.partnerServiceCatalog(),
    queryFn: listPartnerServices,
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

  const walkInHref = buildWalkInPrefillHref(profile.phone, profile.name);

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

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      aria-label="Place assisted doorstep order"
    >
      <InfoBanner variant="default" title="Doorstep pickup">
        Creates an assisted doorstep order for <strong>{laundryName}</strong> (not walk-in).
        Payment defaults to COD.
      </InfoBanner>

      {reorder ? (
        <InfoBanner variant="default" title={`Reorder #${reorder.trackingCode}`}>
          Prefilling services from the past order. Prices refresh from your current catalog.
          {reorderWarnings.length ? (
            <ul className="mt-1 list-disc pl-4 text-xs">
              {reorderWarnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          ) : null}
        </InfoBanner>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="partner-desk-customer-name">Customer name</Label>
          <Input
            id="partner-desk-customer-name"
            autoComplete="name"
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
            className="font-mono"
            readOnly
            aria-readonly="true"
            {...form.register('phone')}
          />
        </div>
      </div>

      <fieldset className="space-y-3 rounded-lg border border-border/80 p-3">
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

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="partner-desk-pickup">Pickup</Label>
          <Input id="partner-desk-pickup" type="datetime-local" {...form.register('pickup_at')} />
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
            {...form.register('delivery_at')}
          />
          {form.formState.errors.delivery_at ? (
            <p className="text-sm text-danger" role="alert">
              {form.formState.errors.delivery_at.message}
            </p>
          ) : null}
        </div>
      </div>

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

      <div className="space-y-1.5">
        <Label htmlFor="partner-desk-notes">Notes (optional)</Label>
        <Textarea id="partner-desk-notes" rows={2} {...form.register('notes')} />
      </div>

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
          <Button asChild type="button" variant="outline" className="min-h-[44px] gap-1.5">
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
    </form>
  );
}
