'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useId, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { AdminPanel } from '@/features/admin/components/admin-panel';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { queryKeys } from '@/lib/query-keys';
import { createLaundry } from '@/services/admin';

export function AdminCreateLaundry() {
  const formId = useId();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const createMutation = useMutation({
    mutationFn: (fd: FormData) =>
      createLaundry({
        owner_email: String(fd.get('owner_email')),
        owner_full_name: String(fd.get('owner_full_name')),
        owner_password: String(fd.get('owner_password') || '') || undefined,
        name: String(fd.get('name')),
        city: String(fd.get('city')),
        address_line: String(fd.get('address_line')),
        description: String(fd.get('description') || '') || undefined,
        auto_approve: fd.get('auto_approve') === 'on',
        services: [
          {
            name: String(fd.get('service_name') || 'Wash & Fold'),
            category: 'wash',
            unit: 'kg',
            price_inr: Number(fd.get('service_price') || 80),
          },
        ],
      }),
    onSuccess: (res) => {
      toast.success(`Laundry created (${res.status})`);
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminPending() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminLaundries() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminDashboard() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.laundries() });
      setOpen(false);
    },
    onError: () => toast.error('Could not create — check email and password'),
  });

  return (
    <AdminPanel
      title="Add laundry & partner"
      description="Onboard manually"
      toolbar={
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <Plus className="h-4 w-4" />
          {open ? 'Hide' : 'Show'}
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      }
      bodyClassName={open ? 'px-4 py-4 sm:px-5' : 'hidden'}
    >
      {open && (
        <div>
          <form
            id={formId}
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              createMutation.mutate(new FormData(form), {
                onSuccess: () => form.reset(),
              });
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor={`${formId}-email`}>Partner email</Label>
                <Input
                  id={`${formId}-email`}
                  name="owner_email"
                  type="email"
                  required
                  autoComplete="off"
                  placeholder="owner@laundry.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`${formId}-password`}>Password (new accounts)</Label>
                <Input
                  id={`${formId}-password`}
                  name="owner_password"
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor={`${formId}-name`}>Partner full name</Label>
                <Input id={`${formId}-name`} name="owner_full_name" required />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor={`${formId}-laundry`}>Laundry name</Label>
                <Input id={`${formId}-laundry`} name="name" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`${formId}-city`}>City</Label>
                <Input id={`${formId}-city`} name="city" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`${formId}-price`}>Default price (₹)</Label>
                <Input
                  id={`${formId}-price`}
                  name="service_price"
                  type="number"
                  defaultValue={80}
                  min={1}
                />
                <input type="hidden" name="service_name" value="Wash & Fold" />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor={`${formId}-address`}>Address</Label>
                <Input id={`${formId}-address`} name="address_line" required />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor={`${formId}-desc`}>Description (optional)</Label>
                <Textarea id={`${formId}-desc`} name="description" rows={2} />
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-3 text-sm">
              <input
                type="checkbox"
                name="auto_approve"
                defaultChecked
                className="h-4 w-4 rounded accent-primary"
              />
              <span>Approve immediately (show on Discover)</span>
            </label>
            <Button type="submit" size="lg" disabled={createMutation.isPending} className="w-full sm:w-auto">
              {createMutation.isPending ? 'Creating…' : 'Create laundry & partner'}
            </Button>
          </form>
        </div>
      )}
    </AdminPanel>
  );
}
