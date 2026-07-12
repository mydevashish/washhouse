'use client';

import { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Scale, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { QueryErrorState } from '@/components/feedback/query-error-state';
import { PageHeader } from '@/components/navigation/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { PAGE_CONTAINER, PAGE_SECTION } from '@/lib/page-layout';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { fetchMe } from '@/services/auth';
import { createAddress, deleteAddress, listAddresses, updateProfile } from '@/services/users';
import { useAuthStore } from '@/store/auth.store';

export default function AccountPage() {
  const formId = useId();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const [name, setName] = useState('');

  const addressesQ = useQuery({
    queryKey: queryKeys.addresses(),
    queryFn: listAddresses,
    enabled: Boolean(accessToken),
    staleTime: STALE.addresses,
  });

  const profileMutation = useMutation({
    mutationFn: () => updateProfile(name),
    onSuccess: (u) => {
      setUser(u);
      toast.success('Profile updated');
    },
    onError: () => toast.error('Update failed'),
  });

  const addressMutation = useMutation({
    mutationFn: (fd: FormData) =>
      createAddress({
        label: String(fd.get('label') || 'Home'),
        line1: String(fd.get('line1')),
        city: String(fd.get('city')),
        state: String(fd.get('state')),
        pincode: String(fd.get('pincode')),
        is_default: fd.get('is_default') === 'on',
      }),
    onSuccess: () => {
      toast.success('Address added');
      void queryClient.invalidateQueries({ queryKey: queryKeys.addresses() });
    },
    onError: () => toast.error('Could not add address'),
  });

  useEffect(() => {
    if (!accessToken) return;
    fetchMe()
      .then((u) => {
        setUser(u);
        setName(u.full_name);
      })
      .catch(() => toast.error('Could not load profile'));
  }, [accessToken, setUser]);

  if (!accessToken) {
    return (
      <div className={`${PAGE_CONTAINER} ${PAGE_SECTION}`}>
        <PageHeader
          title="Account"
          description="Sign in to manage your profile and saved addresses for faster checkout."
        />
        <Button asChild size="lg">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className={`${PAGE_CONTAINER} ${PAGE_SECTION} space-y-5`}>
      <PageHeader
        title="Account"
        description="Your profile and pickup addresses."
        hint="Add at least one address before checkout — we will pick up and deliver there."
      />

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-start gap-3">
            <Scale className="mt-0.5 h-5 w-5 text-primary" aria-hidden />
            <div>
              <p className="font-semibold text-foreground">Dispute center</p>
              <p className="text-sm text-muted-foreground">
                View complaints and locked pickup inventory for your orders.
              </p>
            </div>
          </div>
          <Button type="button" variant="outline" asChild>
            <Link href="/disputes">Open disputes</Link>
          </Button>
        </CardContent>
      </Card>

      {user && (
        <Card>
          <CardHeader className="border-b border-border">
            <h2 className="card-title">Profile</h2>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="grid gap-2">
              <Label htmlFor="profile-name">Full name</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Email: <span className="font-medium text-foreground">{user.email ?? '—'}</span>
            </p>
            <Button
              type="button"
              disabled={profileMutation.isPending}
              onClick={() => profileMutation.mutate()}
            >
              {profileMutation.isPending ? 'Saving…' : 'Save profile'}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="border-b border-border">
          <h2 className="card-title">Addresses</h2>
          <p className="text-sm text-muted-foreground">Used for pickup and delivery on every order.</p>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {addressesQ.isLoading && (
            <div className="space-y-3" aria-busy="true">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          )}

          {addressesQ.isError && (
            <QueryErrorState
              title="Could not load addresses"
              onRetry={() => void addressesQ.refetch()}
              isRetrying={addressesQ.isFetching}
            />
          )}

          {addressesQ.isSuccess && !addressesQ.data?.length && (
            <EmptyState
              icon={MapPin}
              title="No addresses saved"
              description="Add your home or office so checkout takes under a minute."
            />
          )}

          {addressesQ.data && addressesQ.data.length > 0 && (
            <ul className="space-y-3">
              {addressesQ.data.map((a) => (
                <li
                  key={a.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">
                      {a.label}
                      {a.is_default && (
                        <span className="ml-2 text-xs font-medium text-primary">Default</span>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {a.line1}, {a.city} — {a.pincode}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-destructive hover:bg-danger-muted hover:text-destructive"
                    aria-label={`Remove ${a.label}`}
                    onClick={async () => {
                      await deleteAddress(a.id);
                      void queryClient.invalidateQueries({ queryKey: queryKeys.addresses() });
                      toast.success('Address removed');
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <form
            id={formId}
            className="grid gap-4 border-t border-border pt-6 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              addressMutation.mutate(new FormData(e.currentTarget));
              e.currentTarget.reset();
            }}
          >
            <p className="sm:col-span-2 text-sm font-semibold text-foreground">Add new address</p>
            <div className="grid gap-2">
              <Label htmlFor={`${formId}-label`}>Label</Label>
              <Input id={`${formId}-label`} name="label" placeholder="Home" autoComplete="off" />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor={`${formId}-line1`}>Street address</Label>
              <Input id={`${formId}-line1`} name="line1" required autoComplete="street-address" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${formId}-city`}>City</Label>
              <Input id={`${formId}-city`} name="city" required autoComplete="address-level2" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${formId}-state`}>State</Label>
              <Input id={`${formId}-state`} name="state" required autoComplete="address-level1" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${formId}-pincode`}>PIN code</Label>
              <Input
                id={`${formId}-pincode`}
                name="pincode"
                required
                inputMode="numeric"
                pattern="\d{6}"
                autoComplete="postal-code"
                placeholder="6 digits"
              />
            </div>
            <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" name="is_default" className="h-4 w-4 accent-primary" />
              Set as default address
            </label>
            <Button
              type="submit"
              className="sm:col-span-2"
              disabled={addressMutation.isPending}
            >
              {addressMutation.isPending ? 'Adding…' : 'Add address'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
