'use client';

import { Phone, Delete as DeleteIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { normalizeIndianPhoneInput } from '@/features/partner/customer-desk/phone';

type PhoneNumericKeypadProps = {
  value: string;
  onChange: (next: string) => void;
  className?: string;
  /** Max digits after +91 (default 10). */
  maxDigits?: number;
};

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back'] as const;

/**
 * Huge numeric keypad for counter phone entry (low-literacy / wet hands).
 * Digits append; normalizes toward +91XXXXXXXXXX.
 */
export function PhoneNumericKeypad({
  value,
  onChange,
  className,
  maxDigits = 10,
}: PhoneNumericKeypadProps) {
  function digitCount(raw: string): number {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('91') && digits.length > 10) return digits.slice(2).length;
    return digits.length;
  }

  function applyDigit(d: string) {
    if (digitCount(value) >= maxDigits) return;
    const next = normalizeIndianPhoneInput(`${value}${d}`);
    onChange(next);
  }

  function backspace() {
    const digits = value.replace(/\D/g, '');
    if (!digits) {
      onChange('');
      return;
    }
    const trimmed = digits.slice(0, -1);
    onChange(trimmed ? normalizeIndianPhoneInput(trimmed) : '');
  }

  function clearAll() {
    onChange('');
  }

  return (
    <div
      className={cn('space-y-3', className)}
      data-testid="phone-numeric-keypad"
      role="group"
      aria-label="Phone number keypad"
    >
      <div
        className="flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-muted/50 px-4 font-mono text-2xl font-bold tabular-nums tracking-wide text-foreground ring-1 ring-border/60"
        aria-live="polite"
        data-testid="phone-keypad-display"
      >
        <Phone className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
        <span className="truncate">{value || '+91'}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {KEYS.map((key) => {
          if (key === 'clear') {
            return (
              <button
                key={key}
                type="button"
                onClick={clearAll}
                className={cn(
                  'min-h-16 rounded-2xl bg-muted text-base font-semibold text-foreground',
                  'outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  'motion-safe:active:scale-[0.97]',
                )}
                aria-label="Clear phone number"
              >
                Clear
              </button>
            );
          }
          if (key === 'back') {
            return (
              <button
                key={key}
                type="button"
                onClick={backspace}
                className={cn(
                  'inline-flex min-h-16 items-center justify-center rounded-2xl bg-muted',
                  'outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  'motion-safe:active:scale-[0.97]',
                )}
                aria-label="Delete last digit"
              >
                <DeleteIcon className="h-7 w-7" aria-hidden />
              </button>
            );
          }
          return (
            <button
              key={key}
              type="button"
              onClick={() => applyDigit(key)}
              className={cn(
                'min-h-16 rounded-2xl bg-card text-2xl font-bold tabular-nums text-foreground',
                'ring-1 ring-border/70 outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'motion-safe:active:scale-[0.97]',
              )}
              aria-label={`Digit ${key}`}
            >
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
}
