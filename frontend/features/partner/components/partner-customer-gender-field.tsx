'use client';

import { cn } from '@/lib/utils';

export type PartnerCustomerGender = 'male' | 'female';

type Props = {
  value: PartnerCustomerGender | null;
  onChange: (value: PartnerCustomerGender) => void;
  className?: string;
  /** Larger tap targets for floor / cloth wall. */
  size?: 'default' | 'floor';
};

export function PartnerCustomerGenderField({
  value,
  onChange,
  className,
  size = 'default',
}: Props) {
  const btnClass =
    size === 'floor'
      ? 'min-h-12 rounded-full border px-5 text-base font-medium'
      : 'min-h-9 rounded-full border px-4 text-sm font-medium';

  return (
    <fieldset className={cn('space-y-2', className)}>
      <legend className="text-sm font-medium">Gender (on tags)</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Customer gender">
        {(
          [
            { id: 'male' as const, label: 'Male' },
            { id: 'female' as const, label: 'Female' },
          ] as const
        ).map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={value === id}
            onClick={() => onChange(id)}
            className={cn(
              btnClass,
              'transition-colors',
              value === id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background text-muted-foreground hover:text-foreground',
            )}
            data-testid={`customer-gender-${id}`}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Printed as M/F beside the name so bags are not mixed at the rack or on delivery.
      </p>
    </fieldset>
  );
}
