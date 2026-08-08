'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  assistedOrderFormSchema,
  type AssistedOrderFormValues,
} from '@/features/admin/customer-desk/schemas';
import { useAdminAssistedOrderMutations } from '@/features/admin/customer-desk/hooks';
import type { AssistedOrderCreatePayload, CustomerDeskProfile } from '@/features/admin/customer-desk/types';
import { listLaundryOptions, type AdminLaundryRow } from '@/services/admin';
import { getLaundry } from '@/services/laundries';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';

type Props = {
  profile: CustomerDeskProfile;
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

export function CustomerDeskPlaceOrderForm({
  profile,
  onCreateBookingRequest,
  onCreated,
}: Props) {
  const slots = defaultSlots();
  const { createM } = useAdminAssistedOrderMutations({ onCreated });

  const laundriesQ = useQuery({
    queryKey: queryKeys.adminLaundries(),
    queryFn: listLaundryOptions,
    staleTime: STALE.adminDashboard,
  });
  const approved: AdminLaundryRow[] =
    laundriesQ.data?.filter((l) => l.status === 'approved') ?? [];

  const form = useForm<AssistedOrderFormValues>({
    resolver: zodResolver(assistedOrderFormSchema),
    defaultValues: {
      customer_name: profile.name ?? '',
      phone: profile.phone,
      laundry_id: '',
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
    form.reset({
      ...form.getValues(),
      customer_name: profile.name ?? form.getValues('customer_name'),
      phone: profile.phone,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.phone, profile.name]);

  const laundryId = form.watch('laundry_id');
  const laundryDetailQ = useQuery({
    queryKey: queryKeys.laundry(laundryId || 'none'),
    queryFn: () => getLaundry(laundryId),
    enabled: Boolean(laundryId),
    staleTime: 60_000,
  });
  const services =
    laundryDetailQ.data?.services.filter((s) => s.is_active) ?? [];

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  function onSubmit(values: AssistedOrderFormValues) {
    const payload: AssistedOrderCreatePayload = {
      phone: values.phone,
      customer_name: values.customer_name,
      laundry_id: values.laundry_id,
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
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="desk-customer-name">Customer name</Label>
          <Input id="desk-customer-name" autoComplete="name" {...form.register('customer_name')} />
          {form.formState.errors.customer_name ? (
            <p className="text-sm text-danger" role="alert">
              {form.formState.errors.customer_name.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="desk-phone">Phone</Label>
          <Input
            id="desk-phone"
            className="font-mono"
            readOnly
            aria-readonly="true"
            {...form.register('phone')}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="desk-laundry">Laundry</Label>
        <Select
          id="desk-laundry"
          aria-required
          {...form.register('laundry_id')}
          disabled={laundriesQ.isLoading}
        >
          <option value="">Select laundry</option>
          {approved.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name} · {l.city}
            </option>
          ))}
        </Select>
        {form.formState.errors.laundry_id ? (
          <p className="text-sm text-danger" role="alert">
            {form.formState.errors.laundry_id.message}
          </p>
        ) : null}
      </div>

      <fieldset className="space-y-3 rounded-lg border border-border/80 p-3">
        <legend className="px-1 text-sm font-medium">Pickup address</legend>
        <div className="space-y-1.5">
          <Label htmlFor="desk-line1">Address line 1</Label>
          <Input id="desk-line1" {...form.register('address_line1')} />
          {form.formState.errors.address_line1 ? (
            <p className="text-sm text-danger" role="alert">
              {form.formState.errors.address_line1.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="desk-line2">Address line 2 (optional)</Label>
          <Input id="desk-line2" {...form.register('address_line2')} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="desk-city">City</Label>
            <Input id="desk-city" {...form.register('address_city')} />
            {form.formState.errors.address_city ? (
              <p className="text-sm text-danger" role="alert">
                {form.formState.errors.address_city.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="desk-pincode">Pincode</Label>
            <Input
              id="desk-pincode"
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
          <Label htmlFor="desk-landmark">Landmark (optional)</Label>
          <Input id="desk-landmark" {...form.register('address_landmark')} />
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="desk-pickup">Pickup</Label>
          <Input id="desk-pickup" type="datetime-local" {...form.register('pickup_at')} />
          {form.formState.errors.pickup_at ? (
            <p className="text-sm text-danger" role="alert">
              {form.formState.errors.pickup_at.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="desk-delivery">Delivery</Label>
          <Input id="desk-delivery" type="datetime-local" {...form.register('delivery_at')} />
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
            disabled={!laundryId}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Add line
          </Button>
        </div>
        {!laundryId ? (
          <p className="text-xs text-muted-foreground">Select a laundry to load services.</p>
        ) : laundryDetailQ.isLoading ? (
          <p className="text-xs text-muted-foreground">Loading services…</p>
        ) : services.length === 0 ? (
          <p className="text-xs text-muted-foreground">No active services for this laundry.</p>
        ) : null}
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-end"
          >
            <div className="min-w-0 flex-1 space-y-1.5">
              <Label htmlFor={`desk-service-${index}`}>Service</Label>
              <Select
                id={`desk-service-${index}`}
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
              <Label htmlFor={`desk-qty-${index}`}>Qty</Label>
              <Input
                id={`desk-qty-${index}`}
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
        <Label htmlFor="desk-notes">Notes (optional)</Label>
        <Textarea id="desk-notes" rows={2} {...form.register('notes')} />
      </div>

      <p className="text-xs text-muted-foreground">Payment defaults to COD on assisted create.</p>

      <div className="flex flex-col gap-2 border-t border-border/60 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="link"
          className="h-auto justify-start px-0 text-sm"
          onClick={onCreateBookingRequest}
        >
          Create booking request instead
        </Button>
        <Button
          type="submit"
          className="min-h-[44px] w-full sm:w-auto"
          disabled={createM.isPending}
          aria-busy={createM.isPending}
        >
          {createM.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          ) : (
            'Place doorstep order'
          )}
        </Button>
      </div>
    </form>
  );
}
