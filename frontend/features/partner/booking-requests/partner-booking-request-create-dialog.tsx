'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BookingRequestDuplicateBanner } from '@/features/admin/booking-requests/booking-request-duplicate-banner';
import {
  BOOKING_REQUEST_PREFERRED_TIMES,
  BOOKING_REQUEST_PRIORITIES,
  BOOKING_REQUEST_PRIORITY_LABELS,
  BOOKING_REQUEST_SERVICES,
} from '@/features/admin/booking-requests/constants';
import { usePartnerBookingRequestMutations, usePartnerOpenRequestsForPhone } from '@/features/partner/booking-requests/hooks';
import type { PartnerBookingCreatePrefill } from '@/features/partner/booking-requests/types';

const schema = z.object({
  customer_name: z.string().trim().min(1, 'Name is required').max(100),
  phone: z.string().min(8, 'Enter a valid Indian mobile').max(20),
  service_type: z.string().min(1),
  preferred_time_window: z.string().min(1),
  notes: z.string().max(1500).optional(),
  address_text: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  pincode: z.string().max(10).optional(),
  priority: z.enum(['normal', 'high', 'urgent']),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefill?: PartnerBookingCreatePrefill | null;
  onCreated?: (id: string) => void;
};

export function PartnerBookingRequestCreateDialog({
  open,
  onOpenChange,
  prefill,
  onCreated,
}: Props) {
  const { createM } = usePartnerBookingRequestMutations({
    onSettledSuccess: () => onOpenChange(false),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customer_name: '',
      phone: '',
      service_type: BOOKING_REQUEST_SERVICES[0]?.value ?? 'wash-fold',
      preferred_time_window: 'flexible',
      notes: '',
      address_text: '',
      city: '',
      pincode: '',
      priority: 'normal',
    },
  });

  const phoneValue = useWatch({ control: form.control, name: 'phone' }) ?? '';
  const dupQ = usePartnerOpenRequestsForPhone(phoneValue, open);

  useEffect(() => {
    if (!open) return;
    form.reset({
      customer_name: prefill?.customer_name ?? '',
      phone: prefill?.phone ?? '',
      service_type: BOOKING_REQUEST_SERVICES[0]?.value ?? 'wash-fold',
      preferred_time_window: 'flexible',
      notes: '',
      address_text: '',
      city: '',
      pincode: '',
      priority: 'normal',
    });
  }, [open, prefill, form]);

  const onSubmit = form.handleSubmit((values) => {
    createM.mutate(
      {
        customer_name: values.customer_name,
        phone: values.phone,
        service_type: values.service_type,
        preferred_time_window: values.preferred_time_window,
        notes: values.notes || undefined,
        address_text: values.address_text || undefined,
        city: values.city || undefined,
        pincode: values.pincode || undefined,
        priority: values.priority,
      },
      {
        onSuccess: (row) => onCreated?.(row.id),
      },
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New booking request</DialogTitle>
          <DialogDescription>
            Log a phone / walk-in lead for your laundry. It starts as assigned to you.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-3" onSubmit={onSubmit}>
          <BookingRequestDuplicateBanner
            openRequests={dupQ.openRequests}
            loading={dupQ.isFetching}
            scopeNote="your laundry scope"
          />
          <div className="space-y-1">
            <Label htmlFor="pbr-name">Customer name</Label>
            <Input id="pbr-name" {...form.register('customer_name')} />
            {form.formState.errors.customer_name && (
              <p className="text-xs text-destructive">
                {form.formState.errors.customer_name.message}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="pbr-phone">Phone</Label>
            <Input id="pbr-phone" inputMode="tel" {...form.register('phone')} />
            {form.formState.errors.phone && (
              <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="pbr-service">Service</Label>
              <Select id="pbr-service" {...form.register('service_type')}>
                {BOOKING_REQUEST_SERVICES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="pbr-time">Preferred time</Label>
              <Select id="pbr-time" {...form.register('preferred_time_window')}>
                {BOOKING_REQUEST_PREFERRED_TIMES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="pbr-priority">Priority</Label>
            <Select id="pbr-priority" {...form.register('priority')}>
              {BOOKING_REQUEST_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {BOOKING_REQUEST_PRIORITY_LABELS[p]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="pbr-city">City</Label>
            <Input id="pbr-city" {...form.register('city')} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="pbr-pincode">Pincode</Label>
              <Input id="pbr-pincode" {...form.register('pincode')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pbr-address">Address / landmark</Label>
              <Input id="pbr-address" {...form.register('address_text')} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="pbr-notes">Notes</Label>
            <Textarea id="pbr-notes" rows={2} {...form.register('notes')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createM.isPending}>
              {createM.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Create request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
