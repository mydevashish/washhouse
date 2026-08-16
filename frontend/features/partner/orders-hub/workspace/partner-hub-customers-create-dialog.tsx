'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

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
import { createPartnerCustomer } from '@/features/partner/customer-desk/api';
import {
  formatPhoneInputDisplay,
  getPartnerPhoneFieldError,
  isPartnerPhoneReady,
  isValidIndianMobileE164,
  PARTNER_PHONE_INLINE_ERROR,
  partnerPhoneToE164,
} from '@/features/partner/lib/partner-phone-schema';
import { deskPrefillHref } from '@/features/partner/lib/owner-customer-crm';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { queryKeys } from '@/lib/query-keys';
import { useRouter } from 'next/navigation';

type PartnerHubCustomersCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
};

export function PartnerHubCustomersCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: PartnerHubCustomersCreateDialogProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [name, setName] = useState('');
  const [phoneRaw, setPhoneRaw] = useState('');
  const [openDeskAfter, setOpenDeskAfter] = useState(false);

  const phoneError = getPartnerPhoneFieldError(phoneRaw);
  const canSave = Boolean(name.trim()) && isPartnerPhoneReady(phoneRaw);

  const mutation = useMutation({
    mutationFn: () => {
      const phone = partnerPhoneToE164(phoneRaw);
      if (!name.trim()) {
        throw new Error('Customer name is required');
      }
      if (!isValidIndianMobileE164(phone)) {
        throw new Error(PARTNER_PHONE_INLINE_ERROR);
      }
      return createPartnerCustomer({ name: name.trim(), phone });
    },
    onSuccess: (profile) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.partnerCustomerInsightsDashboard() });
      void queryClient.invalidateQueries({ queryKey: ['partner-customer-insights'] });
      toast.success('Customer saved');
      onCreated?.();
      onOpenChange(false);
      setName('');
      setPhoneRaw('');
      if (openDeskAfter && profile.phone) {
        router.push(deskPrefillHref({ user_id: profile.user_id ?? '', phone: profile.phone }));
      }
      setOpenDeskAfter(false);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Could not save customer'));
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="hub-customers-create-dialog">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add customer</DialogTitle>
            <DialogDescription>
              Name and Indian mobile — same validation as walk-in orders. Updates existing numbers.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="hub-customer-name">Name</Label>
              <Input
                id="hub-customer-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
                className="h-9"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hub-customer-phone">Mobile</Label>
              <Input
                id="hub-customer-phone"
                value={phoneRaw}
                onChange={(e) => setPhoneRaw(formatPhoneInputDisplay(e.target.value))}
                inputMode="tel"
                autoComplete="tel"
                placeholder="9876543210"
                required
                className="h-9"
                aria-invalid={Boolean(phoneError)}
                aria-describedby={phoneError ? 'hub-customer-phone-error' : undefined}
              />
              {phoneError ? (
                <p id="hub-customer-phone-error" className="text-xs text-danger" role="alert">
                  {phoneError}
                </p>
              ) : null}
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={openDeskAfter}
                onChange={(e) => setOpenDeskAfter(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              Open desk after save
            </label>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="h-9" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="h-9" disabled={mutation.isPending || !canSave}>
              {mutation.isPending ? 'Saving…' : 'Save customer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
