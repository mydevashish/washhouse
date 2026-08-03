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
import {
  useAdminOpenRequestsForPhone,
  useBookingRequestMutations,
} from '@/features/admin/booking-requests/hooks';
import type { CreatePrefill } from '@/features/admin/booking-requests/booking-request-phone-timeline';
import type { AdminLaundryRow } from '@/services/admin';

const schema = z.object({
  customer_name: z.string().trim().min(1, 'Name is required').max(100),
  phone: z.string().min(8, 'Enter a valid Indian mobile').max(20),
  service_type: z.string().min(1),
  preferred_time_window: z.string().min(1),
  notes: z.string().max(1500).optional(),
  address_text: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  pincode: z.string().max(10).optional(),
  assigned_laundry_id: z.string().optional(),
  priority: z.enum(['normal', 'high', 'urgent']),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  laundries: AdminLaundryRow[];
  prefill?: CreatePrefill | null;
  onCreated?: (id: string) => void;
};

export function BookingRequestCreateDialog({
  open,
  onOpenChange,
  laundries,
  prefill,
  onCreated,
}: Props) {
  const { createM } = useBookingRequestMutations({
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
      assigned_laundry_id: '',
      priority: 'normal',
    },
  });

  const phoneValue = useWatch({ control: form.control, name: 'phone' }) ?? '';
  const dupQ = useAdminOpenRequestsForPhone(phoneValue, open);

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
      assigned_laundry_id: '',
      priority: 'normal',
    });
  }, [open, prefill, form]);

  const approved = laundries.filter((l) => l.status === 'approved');

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
        assigned_laundry_id: values.assigned_laundry_id || undefined,
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
            Create on behalf of a customer phone (CRM). Optionally assign a laundry now.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-3" onSubmit={onSubmit}>
          <BookingRequestDuplicateBanner
            openRequests={dupQ.openRequests}
            loading={dupQ.isFetching}
          />
          <div className="space-y-1">
            <Label htmlFor="br-name">Customer name</Label>
            <Input id="br-name" {...form.register('customer_name')} />
            {form.formState.errors.customer_name && (
              <p className="text-xs text-destructive">
                {form.formState.errors.customer_name.message}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="br-phone">Phone</Label>
            <Input id="br-phone" inputMode="tel" {...form.register('phone')} />
            {form.formState.errors.phone && (
              <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="br-service">Service</Label>
              <Select id="br-service" {...form.register('service_type')}>
                {BOOKING_REQUEST_SERVICES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="br-time">Preferred time</Label>
              <Select id="br-time" {...form.register('preferred_time_window')}>
                {BOOKING_REQUEST_PREFERRED_TIMES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="br-priority">Priority</Label>
              <Select id="br-priority" {...form.register('priority')}>
                {BOOKING_REQUEST_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {BOOKING_REQUEST_PRIORITY_LABELS[p]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="br-laundry">Assign laundry</Label>
              <Select id="br-laundry" {...form.register('assigned_laundry_id')}>
                <option value="">Unassigned (admin inbox)</option>
                {approved.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} · {l.city}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="br-city">City</Label>
            <Input id="br-city" {...form.register('city')} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="br-pincode">Pincode</Label>
              <Input id="br-pincode" {...form.register('pincode')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="br-address">Address / landmark</Label>
              <Input id="br-address" {...form.register('address_text')} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="br-notes">Notes</Label>
            <Textarea id="br-notes" rows={2} {...form.register('notes')} />
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
