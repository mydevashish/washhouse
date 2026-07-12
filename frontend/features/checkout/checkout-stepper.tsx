'use client';

import { Check } from 'lucide-react';

import { CHECKOUT_STEPS, type CheckoutStepIndex } from '@/features/checkout/lib/validation';
import { cn } from '@/lib/utils';

const STEP_HINTS = [
  'Where we collect',
  'Pickup window',
  'Delivery window',
  'Confirm & pay',
] as const;

type CheckoutStepperProps = {
  currentStep: CheckoutStepIndex;
  className?: string;
};

export function CheckoutStepper({ currentStep, className }: CheckoutStepperProps) {
  const progress = ((currentStep + 1) / CHECKOUT_STEPS.length) * 100;

  return (
    <div className={cn('space-y-5', className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">
          Step {currentStep + 1} of {CHECKOUT_STEPS.length}
        </p>
        <p className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {STEP_HINTS[currentStep]}
        </p>
      </div>

      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Checkout progress"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-sky-500 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ol className="grid grid-cols-4 gap-2" aria-label="Checkout steps">
        {CHECKOUT_STEPS.map((label, index) => {
          const done = index < currentStep;
          const active = index === currentStep;
          return (
            <li key={label} className="flex flex-col items-center gap-2 text-center">
              <span
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold transition-all',
                  done && 'border-primary bg-primary text-primary-foreground shadow-sm',
                  active && !done && 'border-primary bg-primary/10 text-primary ring-4 ring-primary/15',
                  !done && !active && 'border-border bg-background text-muted-foreground',
                )}
                aria-current={active ? 'step' : undefined}
              >
                {done ? <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden /> : index + 1}
              </span>
              <span
                className={cn(
                  'hidden text-[10px] font-semibold leading-tight sm:block sm:text-xs',
                  active ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
