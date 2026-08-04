'use client';

import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  isValidIndianMobileE164,
  normalizeIndianPhoneInput,
} from '@/features/admin/customer-desk/phone';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type DeskSearchSubmit =
  | { kind: 'phone'; phone: string }
  | { kind: 'user_id'; user_id: string }
  | { kind: 'query'; q: string };

type Props = {
  initialQuery?: string;
  isLookingUp?: boolean;
  onSubmit: (value: DeskSearchSubmit) => void;
};

function classifyQuery(raw: string): DeskSearchSubmit | { kind: 'error'; message: string } {
  const trimmed = raw.trim();
  if (trimmed.length < 2) {
    return { kind: 'error', message: 'Enter at least 2 characters (name or phone)' };
  }
  if (UUID_RE.test(trimmed)) {
    return { kind: 'user_id', user_id: trimmed };
  }
  // Prefer exact phone when digits look complete
  const digits = trimmed.replace(/\D/g, '');
  const maybePhone =
    digits.length >= 10 ? normalizeIndianPhoneInput(trimmed) : normalizeIndianPhoneInput(trimmed);
  if (isValidIndianMobileE164(maybePhone) || isValidIndianMobileE164(normalizeIndianPhoneInput(digits))) {
    const phone = isValidIndianMobileE164(maybePhone)
      ? maybePhone
      : normalizeIndianPhoneInput(digits);
    return { kind: 'phone', phone };
  }
  // Digits-only short fragment or name → server search
  return { kind: 'query', q: trimmed };
}

export function CustomerDeskSearch({ initialQuery = '', isLookingUp, onSubmit }: Props) {
  const [raw, setRaw] = useState(initialQuery);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialQuery) setRaw(initialQuery);
  }, [initialQuery]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const classified = classifyQuery(raw);
    if (classified.kind === 'error') {
      setError(classified.message);
      return;
    }
    setError(null);
    onSubmit(classified);
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3"
      noValidate
      aria-label="Customer name or phone search"
    >
      <div className="space-y-2">
        <Label htmlFor="customer-desk-search">Name or phone</Label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1 space-y-1.5">
            <Input
              id="customer-desk-search"
              type="search"
              inputMode="search"
              autoComplete="off"
              placeholder="Priya Sharma or +91 98765 43210"
              value={raw}
              onChange={(ev) => {
                setRaw(ev.target.value);
                if (error) setError(null);
              }}
              aria-invalid={Boolean(error)}
              aria-describedby={
                error ? 'customer-desk-search-error' : 'customer-desk-search-hint'
              }
              className="text-base sm:text-sm"
            />
            <p id="customer-desk-search-hint" className="text-xs text-muted-foreground">
              Search by customer name, Indian mobile, or paste a user id.
            </p>
            {error ? (
              <p
                id="customer-desk-search-error"
                className="text-sm text-danger"
                role="alert"
                aria-live="polite"
              >
                {error}
              </p>
            ) : null}
          </div>
          <Button
            type="submit"
            className="min-h-[44px] shrink-0 gap-2 sm:mt-0"
            disabled={isLookingUp}
          >
            <Search className="h-4 w-4" aria-hidden />
            {isLookingUp ? 'Searching…' : 'Search'}
          </Button>
        </div>
      </div>
    </form>
  );
}
