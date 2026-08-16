'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
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
import { InfoBanner } from '@/components/ui/info-banner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { lookupPartnerCustomer, updatePartnerCustomer } from '@/features/partner/customer-desk/api';
import { PARTNER_BTN, PARTNER_INPUT } from '@/features/partner/lib/partner-compact';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { queryKeys } from '@/lib/query-keys';
import type { CustomerInsightRow } from '@/services/customer-insights';
import { cn } from '@/lib/utils';

type PartnerCustomerEditSheetProps = {
  customer: CustomerInsightRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type GenderValue = '' | 'male' | 'female';

function invalidatePartnerCustomerQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.partnerCustomerInsightsDashboard() });
  void queryClient.invalidateQueries({ queryKey: ['partner-customer-insights'] });
}

export function PartnerCustomerEditSheet({
  customer,
  open,
  onOpenChange,
}: PartnerCustomerEditSheetProps) {
  const queryClient = useQueryClient();
  const nameErrorId = useId();
  const [name, setName] = useState(customer.name);
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<GenderValue>('');
  const [notes, setNotes] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  const profileQ = useQuery({
    queryKey: ['partner-customer-edit-profile', customer.user_id],
    queryFn: () => lookupPartnerCustomer({ user_id: customer.user_id }),
    enabled: open && Boolean(customer.user_id),
  });

  const profile = profileQ.data;
  const readOnlyGuest = open && profileQ.isSuccess && !profile?.registered;

  useEffect(() => {
    if (!open) return;
    setName(customer.name);
    setNameError(null);
  }, [open, customer.name]);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? customer.name);
    setEmail(profile.email ?? '');
    setGender((profile.gender as GenderValue) ?? '');
    setNotes(profile.notes ?? '');
  }, [profile, customer.name]);

  const mutation = useMutation({
    mutationFn: () => {
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error('Customer name is required');
      }
      return updatePartnerCustomer(customer.user_id, {
        name: trimmedName,
        email: email.trim() || null,
        gender: gender || null,
        notes: notes.trim() || null,
      });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['partner-customer-insights'] });
      const previous = queryClient.getQueriesData<{ items?: CustomerInsightRow[] }>({
        queryKey: ['partner-customer-insights'],
      });
      queryClient.setQueriesData<{ items?: CustomerInsightRow[] }>(
        { queryKey: ['partner-customer-insights'] },
        (old) => {
          if (!old?.items) return old;
          return {
            ...old,
            items: old.items.map((row) =>
              row.user_id === customer.user_id ? { ...row, name: name.trim() } : row,
            ),
          };
        },
      );
      return { previous };
    },
    onSuccess: (result) => {
      invalidatePartnerCustomerQueries(queryClient);
      toast.success('Customer updated');
      setName(result.name);
      onOpenChange(false);
    },
    onError: (err, _vars, context) => {
      context?.previous?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      toast.error(getApiErrorMessage(err, 'Could not update customer'));
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Customer name is required');
      return;
    }
    setNameError(null);
    mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="partner-customer-edit-sheet">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit customer</DialogTitle>
            <DialogDescription>
              Update name, email, or notes. Mobile stays locked after registration.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {readOnlyGuest ? (
              <InfoBanner variant="warning" title="Register on first order">
                This guest is not registered yet — take their first order to create a profile you can
                edit here.
              </InfoBanner>
            ) : null}

            {profileQ.isLoading ? (
              <div className="space-y-3" data-testid="partner-customer-edit-loading">
                <Skeleton className="h-9 w-full rounded-md" />
                <Skeleton className="h-9 w-full rounded-md" />
                <Skeleton className="h-20 w-full rounded-md" />
              </div>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="partner-customer-edit-name">Name</Label>
                  <Input
                    id="partner-customer-edit-name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (nameError) setNameError(null);
                    }}
                    autoComplete="name"
                    disabled={readOnlyGuest || mutation.isPending}
                    aria-invalid={Boolean(nameError)}
                    aria-describedby={nameError ? nameErrorId : undefined}
                    className={PARTNER_INPUT}
                    data-testid="partner-customer-edit-name"
                  />
                  {nameError ? (
                    <p id={nameErrorId} className="text-xs text-danger" role="alert">
                      {nameError}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="partner-customer-edit-phone">Mobile</Label>
                  <Input
                    id="partner-customer-edit-phone"
                    value={customer.phone ?? ''}
                    readOnly
                    disabled
                    className={cn(PARTNER_INPUT, 'bg-muted text-muted-foreground')}
                    data-testid="partner-customer-edit-phone"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="partner-customer-edit-email">Email (optional)</Label>
                  <Input
                    id="partner-customer-edit-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    disabled={readOnlyGuest || mutation.isPending}
                    className={PARTNER_INPUT}
                    data-testid="partner-customer-edit-email"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="partner-customer-edit-gender">Gender (optional)</Label>
                  <Select
                    id="partner-customer-edit-gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as GenderValue)}
                    disabled={readOnlyGuest || mutation.isPending}
                    className={PARTNER_INPUT}
                    data-testid="partner-customer-edit-gender"
                  >
                    <option value="">Not specified</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="partner-customer-edit-notes">Notes (optional)</Label>
                  <Textarea
                    id="partner-customer-edit-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    disabled={readOnlyGuest || mutation.isPending}
                    className="min-h-[72px] text-sm"
                    data-testid="partner-customer-edit-notes"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className={PARTNER_BTN}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className={PARTNER_BTN}
              disabled={readOnlyGuest || mutation.isPending || profileQ.isLoading}
              data-testid="partner-customer-edit-save"
            >
              {mutation.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PartnerCustomerEditTrigger({
  customer,
  className,
}: {
  customer: CustomerInsightRow;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(PARTNER_BTN, 'gap-1.5', className)}
        onClick={() => setOpen(true)}
        aria-label={`Edit ${customer.name}`}
        data-testid="partner-customer-edit-trigger"
      >
        <Pencil className="h-3.5 w-3.5" aria-hidden />
        Edit
      </Button>
      <PartnerCustomerEditSheet customer={customer} open={open} onOpenChange={setOpen} />
    </>
  );
}
