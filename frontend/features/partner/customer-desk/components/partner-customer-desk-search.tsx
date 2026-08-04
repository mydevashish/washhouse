'use client';

import { PackagePlus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  isValidIndianMobileE164,
  normalizeIndianPhoneInput,
} from '@/features/partner/customer-desk/phone';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type PartnerDeskSearchSubmit =
  | { kind: 'phone'; phone: string }
  | { kind: 'user_id'; user_id: string }
  | { kind: 'query'; q: string };

type Props = {
  initialQuery?: string;
  isLookingUp?: boolean;
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
  onNewOrder,
  onOpenDesk,
}: Props) {
  const [raw, setRaw] = useState(initialQuery);
  const [error, setError] = useState<string | null>(null);

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
      className="space-y-3"
      noValidate
      aria-label="Customer name or phone search"
    >
      <div className="space-y-2">
        <Label htmlFor="partner-customer-desk-search" className="text-base">
          Name or phone
        </Label>
        <Input
          id="partner-customer-desk-search"
          type="search"
          inputMode="search"
          autoComplete="off"
          autoFocus
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
          className="h-14 text-xl tracking-wide sm:h-12 sm:text-lg"
        />
        <p id="partner-customer-desk-search-hint" className="text-xs text-muted-foreground">
          Search by name or Indian mobile. Exact phone opens the desk immediately.
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

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="submit"
          size="lg"
          className="min-h-[48px] flex-1 gap-2 text-base"
          disabled={isLookingUp}
        >
          <PackagePlus className="h-5 w-5" aria-hidden />
          {isLookingUp ? 'Opening…' : 'New order'}
        </Button>
        {onOpenDesk ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="min-h-[48px] gap-2 sm:flex-none"
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
