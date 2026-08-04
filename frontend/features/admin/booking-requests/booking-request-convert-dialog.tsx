'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  assistedOrderFormSchema,
  type AssistedOrderFormValues,
} from '@/features/admin/customer-desk/schemas';
import type { BookingRequestDetail } from '@/features/admin/booking-requests/types';
import type { AdminLaundryRow } from '@/services/admin';
import { getLaundry } from '@/services/laundries';
import { queryKeys } from '@/lib/query-keys';

export type BookingRequestConvertSubmit = {
  laundry_id: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    pincode: string;
    landmark?: string;
  };
  pickup_at: string;
  delivery_at: string;
  items: { service_id: string; quantity: number }[];
  notes?: string;
  force: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail: BookingRequestDetail;
  laundries: AdminLaundryRow[];
  pending?: boolean;
  onSubmit: (payload: BookingRequestConvertSubmit) => void;
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

export function BookingRequestConvertDialog({
  open,
  onOpenChange,
  detail,
  laundries,
  pending = false,
  onSubmit,
}: Props) {
  const slots = defaultSlots();
  const approved = laundries.filter((l) => l.status === 'approved');
  const force = detail.status === 'contacted';

  const form = useForm<AssistedOrderFormValues>({
    resolver: zodResolver(assistedOrderFormSchema),
    defaultValues: {
      customer_name: detail.customer_name,
      phone: detail.phone_e164,
      laundry_id: detail.assigned_laundry_id ?? '',
      address_line1: detail.address_text ?? '',
      address_line2: '',
      address_city: detail.city ?? '',
      address_pincode: detail.pincode ?? '',
      address_landmark: '',
      pickup_at: slots.pickup_at,
      delivery_at: slots.delivery_at,
      notes: detail.notes ?? '',
      items: [{ service_id: '', quantity: 1 }],
    },
  });

  useEffect(() => {
    if (!open) return;
    const next = defaultSlots();
    form.reset({
      customer_name: detail.customer_name,
      phone: detail.phone_e164,
      laundry_id: detail.assigned_laundry_id ?? '',
      address_line1: detail.address_text ?? '',
      address_line2: '',
      address_city: detail.city ?? '',
      address_pincode: detail.pincode ?? '',
      address_landmark: '',
      pickup_at: next.pickup_at,
      delivery_at: next.delivery_at,
      notes: detail.notes ?? '',
      items: [{ service_id: '', quantity: 1 }],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, detail.id]);

  const laundryId = form.watch('laundry_id');
  const laundryDetailQ = useQuery({
    queryKey: queryKeys.laundry(laundryId || 'none'),
    queryFn: () => getLaundry(laundryId),
    enabled: Boolean(open && laundryId),
    staleTime: 60_000,
  });
  const services = laundryDetailQ.data?.services.filter((s) => s.is_active) ?? [];

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  function handleSubmit(values: AssistedOrderFormValues) {
    onSubmit({
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
      force,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Convert to order</DialogTitle>
          <DialogDescription>
            Creates an assisted doorstep order for {detail.public_code}
            {force ? ' (force from contacted).' : '.'} Phone and name stay on the booking request.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(handleSubmit)}
          noValidate
          aria-label="Convert booking request to order"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Customer</Label>
              <Input value={detail.customer_name} readOnly aria-readonly="true" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input className="font-mono" value={detail.phone_e164} readOnly aria-readonly="true" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="br-convert-laundry">Laundry</Label>
            <Select id="br-convert-laundry" aria-required {...form.register('laundry_id')}>
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
              <Label htmlFor="br-convert-line1">Address line 1</Label>
              <Input id="br-convert-line1" {...form.register('address_line1')} />
              {form.formState.errors.address_line1 ? (
                <p className="text-sm text-danger" role="alert">
                  {form.formState.errors.address_line1.message}
                </p>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="br-convert-city">City</Label>
                <Input id="br-convert-city" {...form.register('address_city')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="br-convert-pin">Pincode</Label>
                <Input
                  id="br-convert-pin"
                  inputMode="numeric"
                  maxLength={6}
                  {...form.register('address_pincode')}
                />
              </div>
            </div>
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="br-convert-pickup">Pickup</Label>
              <Input id="br-convert-pickup" type="datetime-local" {...form.register('pickup_at')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="br-convert-delivery">Delivery</Label>
              <Input
                id="br-convert-delivery"
                type="datetime-local"
                {...form.register('delivery_at')}
              />
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
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-end"
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Label htmlFor={`br-convert-svc-${index}`}>Service</Label>
                  <Select
                    id={`br-convert-svc-${index}`}
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
                  <Label htmlFor={`br-convert-qty-${index}`}>Qty</Label>
                  <Input
                    id={`br-convert-qty-${index}`}
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
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="br-convert-notes">Notes (optional)</Label>
            <Textarea id="br-convert-notes" rows={2} {...form.register('notes')} />
          </div>

          <div className="flex justify-end gap-2 border-t border-border/60 pt-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending} aria-busy={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : 'Convert'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
