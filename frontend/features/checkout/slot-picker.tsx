'use client';

import { AlertCircle } from 'lucide-react';

import { InfoBanner } from '@/components/ui/info-banner';
import type { TimeSlot } from '@/features/checkout/lib/slots';
import { cn } from '@/lib/utils';

type SlotPickerProps = {
  slots: TimeSlot[];
  value: string;
  onChange: (slotId: string) => void;
  error?: string;
  emptyMessage?: string;
  name: string;
  isLoading?: boolean;
};

export function SlotPicker({
  slots,
  value,
  onChange,
  error,
  emptyMessage = 'No slots available. Try a different pickup time.',
  name,
  isLoading = false,
}: SlotPickerProps) {
  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2" aria-busy="true" aria-label="Loading time slots">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  if (!slots.length) {
    return (
      <InfoBanner variant="warning" icon={AlertCircle} title="No slots available">
        {emptyMessage}
      </InfoBanner>
    );
  }

  return (
    <div>
      <fieldset>
        <legend className="sr-only">{name}</legend>
        <ul className="grid gap-3 sm:grid-cols-2">
          {slots.map((slot) => {
            const selected = value === slot.id;
            return (
              <li key={slot.id}>
                <label
                  className={cn(
                    'flex min-h-[56px] cursor-pointer flex-col rounded-xl border px-4 py-3 transition-colors',
                    selected
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/40 hover:bg-muted/50',
                    error && !selected && 'border-danger/40',
                  )}
                >
                  <input
                    type="radio"
                    name={name}
                    value={slot.id}
                    checked={selected}
                    onChange={() => onChange(slot.id)}
                    className="sr-only"
                  />
                  <span className="font-semibold text-foreground">{slot.label}</span>
                  <span className="text-sm text-muted-foreground">{slot.sublabel}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>
      {error && (
        <p className="mt-3 flex items-center gap-2 text-sm text-danger" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}
