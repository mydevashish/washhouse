'use client';

import Link from 'next/link';
import { AlertCircle, MapPin } from 'lucide-react';

import { InfoBanner } from '@/components/ui/info-banner';
import { Skeleton } from '@/components/ui/skeleton';
import type { Address } from '@/services/users';
import { cn } from '@/lib/utils';

type AddressStepProps = {
  addresses: Address[] | undefined;
  isLoading: boolean;
  isError: boolean;
  value: string;
  onChange: (id: string) => void;
  error?: string;
};

export function AddressStep({
  addresses,
  isLoading,
  isError,
  value,
  onChange,
  error,
}: AddressStepProps) {
  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading addresses">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <InfoBanner variant="destructive" icon={AlertCircle} title="Could not load addresses">
        Check your connection and try again, or add an address in your account.
      </InfoBanner>
    );
  }

  if (!addresses?.length) {
    return (
      <InfoBanner variant="warning" icon={MapPin} title="Add a pickup address">
        <p>You need at least one saved address. It only takes a minute.</p>
        <Link
          href="/account"
          className="mt-2 inline-block font-semibold text-primary hover:underline"
        >
          Go to account → Add address
        </Link>
      </InfoBanner>
    );
  }

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        We will pick up and deliver to this address. Tap one to select.
      </p>
      <ul className="space-y-3">
        {addresses.map((addr) => {
          const selected = value === addr.id;
          return (
            <li key={addr.id}>
              <label
                className={cn(
                  'flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors',
                  selected
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/40',
                  error && !selected && 'border-danger/40',
                )}
              >
                <input
                  type="radio"
                  name="checkout-address"
                  value={addr.id}
                  checked={selected}
                  onChange={() => onChange(addr.id)}
                  className="mt-1 h-4 w-4 shrink-0 accent-primary"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{addr.label}</span>
                    {addr.is_default && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        Default
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {addr.line1}
                    {addr.line2 ? `, ${addr.line2}` : ''}, {addr.city} — {addr.pincode}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      {error && (
        <p className="mt-3 flex items-center gap-2 text-sm text-danger" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}
