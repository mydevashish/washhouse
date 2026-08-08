'use client';

import { Keyboard, PackagePlus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  isValidIndianMobileE164,
  normalizeIndianPhoneInput,
} from '@/features/partner/customer-desk/phone';
import { PhoneNumericKeypad } from '@/features/partner-shop-floor/components/phone-numeric-keypad';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type PartnerDeskSearchSubmit =
  | { kind: 'phone'; phone: string }
  | { kind: 'user_id'; user_id: string }
  | { kind: 'query'; q: string };

type Props = {
  initialQuery?: string;
  isLookingUp?: boolean;
  /** Compact hub strip vs full Customer Desk. */
  density?: 'default' | 'compact';
  /** Primary — exact phone opens place-order; name search lists matches. */
  onNewOrder: (value: PartnerDeskSearchSubmit) => void;
  /** Secondary — open orders desk (exact phone / user_id / after picking a result). */
  onOpenDesk?: (value: PartnerDeskSearchSubmit) => void;
};

function classifyQuery(
  raw: string,
): PartnerDeskSearchSubmit | { kind: 'error'; message: string } {
  const trimmed = raw.trim();
  if (trimmed.length < 2) {
    return { kind: 'error', message: 'Enter at least 2 characters (name or phone)' };
  }
  if (UUID_RE.test(trimmed)) {
    return { kind: 'user_id', user_id: trimmed };
  }
  const digits = trimmed.replace(/\D/g, '');
  const maybePhone = normalizeIndianPhoneInput(trimmed);
  const fromDigits = normalizeIndianPhoneInput(digits);
  if (isValidIndianMobileE164(maybePhone) || isValidIndianMobileE164(fromDigits)) {
    const phone = isValidIndianMobileE164(maybePhone) ? maybePhone : fromDigits;
    return { kind: 'phone', phone };
  }
  return { kind: 'query', q: trimmed };
}

export function PartnerCustomerDeskSearch({
  initialQuery = '',
  isLookingUp,
  density = 'default',
  onNewOrder,
  onOpenDesk,
}: Props) {
  const [raw, setRaw] = useState(initialQuery);
  const [error, setError] = useState<string | null>(null);
  const [keypadOpen, setKeypadOpen] = useState(false);
  const compact = density === 'compact';

  useEffect(() => {
    if (initialQuery) setRaw(initialQuery);
  }, [initialQuery]);

  function parse(): PartnerDeskSearchSubmit | null {
    const classified = classifyQuery(raw);
    if (classified.kind === 'error') {
      setError(classified.message);
      return null;
    }
    setError(null);
    return classified;
  }

  function submitNewOrder(e: React.FormEvent) {
    e.preventDefault();
    const value = parse();
    if (value) onNewOrder(value);
  }

  function submitOpenDesk() {
    const value = parse();
    if (value) onOpenDesk?.(value);
  }

  return (
    <form
      onSubmit={submitNewOrder}
      className={compact ? 'space-y-2' : 'space-y-3'}
      noValidate
      aria-label="Customer name or phone search"
    >
      <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label
            htmlFor="partner-customer-desk-search"
            className={compact ? 'text-sm font-medium' : 'text-base'}
          >
            {compact ? 'Find customer' : 'Name or phone'}
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={compact ? 'h-8 gap-1 px-2 text-xs' : 'h-9 gap-1.5'}
            onClick={() => setKeypadOpen((v) => !v)}
            aria-pressed={keypadOpen}
            aria-controls="partner-desk-phone-keypad"
          >
            <Keyboard className="h-3.5 w-3.5" aria-hidden />
            {keypadOpen ? 'Hide keypad' : 'Phone keypad'}
          </Button>
        </div>
        <Input
          id="partner-customer-desk-search"
          type="search"
          inputMode={keypadOpen ? 'none' : 'search'}
          autoComplete="off"
          autoFocus={!compact}
          placeholder="Priya or 98765 43210"
          value={raw}
          onChange={(ev) => {
            setRaw(ev.target.value);
            if (error) setError(null);
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error
              ? 'partner-customer-desk-search-error'
              : 'partner-customer-desk-search-hint'
          }
          className={
            compact
              ? 'h-9 text-sm tracking-normal'
              : 'h-14 text-xl tracking-wide sm:h-12 sm:text-lg'
          }
        />
        <p id="partner-customer-desk-search-hint" className="text-xs text-muted-foreground">
          {compact
            ? 'Name or Indian mobile — exact phone opens history.'
            : 'Search by name or Indian mobile. Exact phone opens the desk immediately.'}
        </p>
        {error ? (
          <p
            id="partner-customer-desk-search-error"
            className="text-sm text-danger"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        ) : null}
      </div>

      {keypadOpen ? (
        <div id="partner-desk-phone-keypad">
          <PhoneNumericKeypad
            value={raw}
            onChange={(next) => {
              setRaw(next);
              if (error) setError(null);
            }}
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5 sm:flex-row">
        <Button
          type="submit"
          size={compact ? 'sm' : 'lg'}
          className={compact ? 'h-9 flex-1 gap-1.5' : 'min-h-[48px] flex-1 gap-2 text-base'}
          disabled={isLookingUp}
        >
          <PackagePlus className={compact ? 'h-3.5 w-3.5' : 'h-5 w-5'} aria-hidden />
          {isLookingUp ? 'Opening…' : 'New order'}
        </Button>
        {onOpenDesk ? (
          <Button
            type="button"
            variant="outline"
            size={compact ? 'sm' : 'lg'}
            className={compact ? 'h-9 gap-1.5 sm:flex-none' : 'min-h-[48px] gap-2 sm:flex-none'}
            disabled={isLookingUp}
            onClick={submitOpenDesk}
          >
            <Search className="h-4 w-4" aria-hidden />
            Open desk
          </Button>
        ) : null}
      </div>
    </form>
  );
}
