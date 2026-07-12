'use client';

import { AlertCircle, Banknote, CreditCard } from 'lucide-react';

import { InfoBanner } from '@/components/ui/info-banner';
import { formatInr } from '@/features/discover/detail/order-pricing';
import { cn } from '@/lib/utils';

type PaymentStepProps = {
  value: 'cod' | 'razorpay' | '';
  onChange: (method: 'cod' | 'razorpay') => void;
  total: number;
  error?: string;
  submitError?: string;
};

export function PaymentStep({ value, onChange, total, error, submitError }: PaymentStepProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-muted/40 p-4">
        <p className="text-sm text-muted-foreground">Amount due</p>
        <p className="text-3xl font-bold tabular-nums text-foreground">{formatInr(total)}</p>
        <p className="mt-1 text-xs text-muted-foreground">Includes GST and delivery fee</p>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-foreground">Payment method</legend>

        <PaymentOption
          icon={Banknote}
          title="Cash on delivery"
          description="Pay when your order is delivered"
          selected={value === 'cod'}
          onSelect={() => onChange('cod')}
          hasError={Boolean(error) && value !== 'cod'}
        />
        <PaymentOption
          icon={CreditCard}
          title="UPI / Card"
          description="Pay securely online (Razorpay)"
          selected={value === 'razorpay'}
          onSelect={() => onChange('razorpay')}
          hasError={Boolean(error) && value !== 'razorpay'}
        />
      </fieldset>

      {error && (
        <p className="flex items-center gap-2 text-sm text-danger" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      {submitError && (
        <InfoBanner variant="destructive" icon={AlertCircle} title="Could not place order">
          {submitError}
        </InfoBanner>
      )}

      <InfoBanner variant="success" title="Almost done">
        Review is complete. Tap &quot;Place order&quot; below — this usually takes under a minute.
      </InfoBanner>
    </div>
  );
}

function PaymentOption({
  icon: Icon,
  title,
  description,
  selected,
  onSelect,
  hasError,
}: {
  icon: typeof Banknote;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
  hasError?: boolean;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors',
        selected ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border',
        hasError && !selected && 'border-danger/40',
      )}
    >
      <input
        type="radio"
        name="payment"
        checked={selected}
        onChange={onSelect}
        className="h-4 w-4 accent-primary"
      />
      <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden />
      <span>
        <span className="block font-medium text-foreground">{title}</span>
        <span className="text-sm text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}
