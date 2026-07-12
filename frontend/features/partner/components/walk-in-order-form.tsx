'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ServiceCatalogItem } from '@/services/partner-service-catalog';

const lineSchema = z.object({
  service_id: z.string().min(1, 'Select a service'),
  quantity: z.coerce.number().int().min(1).max(500),
});

const walkInFormSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required').max(200),
  customer_phone: z
    .string()
    .transform((value) => value.replace(/\s/g, ''))
    .pipe(z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Enter a valid phone number (e.g. +91XXXXXXXXXX)')),
  notes: z.string().max(2000).optional(),
  expected_ready_at: z.string().optional(),
  items: z.array(lineSchema).min(1, 'Add at least one service'),
});

export type WalkInFormValues = z.infer<typeof walkInFormSchema>;

type WalkInOrderFormProps = {
  services: ServiceCatalogItem[];
  onSubmit: (values: WalkInFormValues) => void;
  isSubmitting?: boolean;
};

export function WalkInOrderForm({ services, onSubmit, isSubmitting }: WalkInOrderFormProps) {
  const activeServices = services.filter((s) => s.is_active && (s.catalog_status ?? 'active') === 'active');

  const form = useForm<WalkInFormValues>({
    resolver: zodResolver(walkInFormSchema),
    defaultValues: {
      customer_name: '',
      customer_phone: '',
      notes: '',
      expected_ready_at: '',
      items: [{ service_id: '', quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="customer_name">Customer name</Label>
          <Input id="customer_name" autoComplete="name" {...form.register('customer_name')} />
          {form.formState.errors.customer_name && (
            <p className="text-sm text-danger">{form.formState.errors.customer_name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="customer_phone">Customer phone (WhatsApp)</Label>
          <Input
            id="customer_phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+91XXXXXXXXXX"
            {...form.register('customer_phone')}
          />
          <p className="text-sm text-muted-foreground">
            Customer booked by phone? Enter their WhatsApp number — they&apos;ll receive order updates
            automatically.
          </p>
          {form.formState.errors.customer_phone && (
            <p className="text-sm text-danger">{form.formState.errors.customer_phone.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Services</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => append({ service_id: '', quantity: 1 })}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add line
          </Button>
        </div>
        {fields.map((field, index) => (
          <div key={field.id} className="flex flex-col gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor={`service-${index}`}>Service</Label>
              <select
                id={`service-${index}`}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...form.register(`items.${index}.service_id`)}
              >
                <option value="">Select service</option>
                {activeServices.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} — ₹{service.price_inr}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full space-y-2 sm:w-24">
              <Label htmlFor={`qty-${index}`}>Qty</Label>
              <Input
                id={`qty-${index}`}
                type="number"
                min={1}
                {...form.register(`items.${index}.quantity`)}
              />
            </div>
            {fields.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-danger"
                aria-label="Remove line"
                onClick={() => remove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        {form.formState.errors.items?.message && (
          <p className="text-sm text-danger">{form.formState.errors.items.message}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="expected_ready_at">Expected ready (optional)</Label>
          <Input id="expected_ready_at" type="datetime-local" {...form.register('expected_ready_at')} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Partner notes (optional)</Label>
          <Textarea id="notes" rows={2} {...form.register('notes')} />
        </div>
      </div>

      <Button type="submit" className="min-h-[44px] w-full sm:w-auto" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : 'Save walk-in order'}
      </Button>
    </form>
  );
}
