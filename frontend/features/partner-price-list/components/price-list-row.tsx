'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { PriceRowDraft } from '@/features/partner-price-list/types';
import { displayInr } from '@/features/partner-price-list/schemas/price-row';

type PriceListRowProps = {
  draft: PriceRowDraft;
  variant: 'mobile' | 'desktop';
  onChange: (next: PriceRowDraft) => void;
  errorField?: 'dry_clean_inr' | 'press_inr' | 'price_inr' | 'is_offered';
};

function MoneyInput({
  id,
  label,
  value,
  placeholder,
  disabled,
  invalid,
  onChange,
  hideLabel,
}: {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  hideLabel?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className={cn('text-xs text-muted-foreground', hideLabel && 'sr-only')}>
        {label}
      </Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          ₹
        </span>
        <Input
          id={id}
          inputMode="decimal"
          type="text"
          autoComplete="off"
          disabled={disabled}
          value={value}
          placeholder={placeholder}
          aria-invalid={invalid || undefined}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'h-11 min-h-[44px] pl-7 tabular-nums sm:h-9 sm:min-h-0',
            invalid && 'border-danger focus-visible:ring-danger',
          )}
        />
      </div>
    </div>
  );
}

export function PriceListRow({ draft, variant, onChange, errorField }: PriceListRowProps) {
  const unitLabel = draft.unit === 'kg' ? '/kg' : '';
  const isSingle = draft.price_mode === 'single';
  const isDeferred = draft.price_mode === 'deferred';
  const idPrefix = `${variant}-${draft.catalog_item_id}`;

  const suggestedHint = isSingle
    ? draft.suggested_price_inr
      ? `Suggested ₹${displayInr(draft.suggested_price_inr)}`
      : undefined
    : [
        draft.suggested_dry_clean_inr ? `DC ₹${displayInr(draft.suggested_dry_clean_inr)}` : null,
        draft.allows_press && draft.suggested_press_inr
          ? `Press ₹${displayInr(draft.suggested_press_inr)}`
          : null,
      ]
        .filter(Boolean)
        .join(' · ');

  const offeredToggle = (
    <label className="flex min-h-[44px] cursor-pointer items-center gap-3 sm:min-h-0 sm:justify-end">
      <input
        type="checkbox"
        className="h-5 w-5 shrink-0 rounded border-border accent-brand-500"
        checked={draft.is_offered}
        disabled={isDeferred}
        aria-invalid={errorField === 'is_offered' || undefined}
        onChange={(e) => onChange({ ...draft, is_offered: e.target.checked })}
      />
      <span className={cn('text-sm font-medium', variant === 'desktop' && 'sr-only')}>Offered</span>
    </label>
  );

  if (variant === 'mobile') {
    return (
      <div
        className={cn(
          'space-y-3 rounded-xl border border-border/60 bg-card p-3',
          !draft.is_offered && 'opacity-70',
        )}
        data-testid={`price-row-mobile-${draft.catalog_item_id}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium leading-snug">{draft.name}</p>
            {suggestedHint && (
              <p className="mt-0.5 text-xs text-muted-foreground">{suggestedHint}</p>
            )}
          </div>
          {offeredToggle}
        </div>
        {isDeferred ? (
          <p className="text-sm text-muted-foreground">Ask store — rates coming soon</p>
        ) : isSingle ? (
          <MoneyInput
            id={`${idPrefix}-rate`}
            label={`Rate ${unitLabel}`.trim()}
            value={draft.price_inr}
            placeholder={displayInr(draft.suggested_price_inr) || '0'}
            invalid={errorField === 'price_inr'}
            onChange={(price_inr) => onChange({ ...draft, price_inr })}
          />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <MoneyInput
              id={`${idPrefix}-dc`}
              label="Dry clean"
              value={draft.dry_clean_inr}
              placeholder={displayInr(draft.suggested_dry_clean_inr) || '0'}
              invalid={errorField === 'dry_clean_inr'}
              onChange={(dry_clean_inr) => onChange({ ...draft, dry_clean_inr })}
            />
            <MoneyInput
              id={`${idPrefix}-press`}
              label="Press"
              value={draft.press_inr}
              placeholder={draft.allows_press ? displayInr(draft.suggested_press_inr) || '0' : '—'}
              disabled={!draft.allows_press}
              invalid={errorField === 'press_inr'}
              onChange={(press_inr) => onChange({ ...draft, press_inr })}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <tr
      className={cn(!draft.is_offered && 'opacity-70')}
      data-testid={`price-row-desktop-${draft.catalog_item_id}`}
    >
      <td className="px-4 py-3">
        <p className="font-medium">{draft.name}</p>
        {suggestedHint && <p className="mt-0.5 text-xs text-muted-foreground">{suggestedHint}</p>}
      </td>
      <td className="px-4 py-3" colSpan={isSingle || isDeferred ? 2 : 1}>
        {isDeferred ? (
          <span className="text-sm text-muted-foreground">Ask store</span>
        ) : isSingle ? (
          <MoneyInput
            id={`${idPrefix}-rate`}
            label={`Rate ${unitLabel}`.trim()}
            value={draft.price_inr}
            placeholder={displayInr(draft.suggested_price_inr) || '0'}
            invalid={errorField === 'price_inr'}
            hideLabel
            onChange={(price_inr) => onChange({ ...draft, price_inr })}
          />
        ) : (
          <MoneyInput
            id={`${idPrefix}-dc`}
            label="Dry clean"
            value={draft.dry_clean_inr}
            placeholder={displayInr(draft.suggested_dry_clean_inr) || '0'}
            invalid={errorField === 'dry_clean_inr'}
            hideLabel
            onChange={(dry_clean_inr) => onChange({ ...draft, dry_clean_inr })}
          />
        )}
      </td>
      {!isSingle && !isDeferred && (
        <td className="px-4 py-3">
          <MoneyInput
            id={`${idPrefix}-press`}
            label="Press"
            value={draft.press_inr}
            placeholder={draft.allows_press ? displayInr(draft.suggested_press_inr) || '0' : '—'}
            disabled={!draft.allows_press}
            invalid={errorField === 'press_inr'}
            hideLabel
            onChange={(press_inr) => onChange({ ...draft, press_inr })}
          />
        </td>
      )}
      <td className="px-4 py-3 text-right">{offeredToggle}</td>
    </tr>
  );
}
