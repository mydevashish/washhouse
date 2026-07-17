import { z } from 'zod';

import type { PartnerPriceItemUpsert, PriceMode, PriceRowDraft } from '@/features/partner-price-list/types';

const MAX_INR = 99999.99;

/** Empty or valid INR amount with up to 2 decimal places. */
export const optionalInrSchema = z
  .string()
  .trim()
  .refine((value) => value === '' || /^\d+(\.\d{1,2})?$/.test(value), {
    message: 'Enter a valid amount (e.g. 69 or 69.50)',
  })
  .refine((value) => value === '' || Number(value) <= MAX_INR, {
    message: `Amount must be at most ₹${MAX_INR}`,
  });

export type PriceRowValidationError = {
  catalog_item_id: string;
  field?: 'dry_clean_inr' | 'press_inr' | 'price_inr' | 'is_offered';
  message: string;
};

function parseOptionalInr(raw: string): { ok: true; value: string | null } | { ok: false; message: string } {
  const trimmed = raw.trim();
  const result = optionalInrSchema.safeParse(trimmed);
  if (!result.success) {
    return { ok: false, message: result.error.issues[0]?.message ?? 'Invalid amount' };
  }
  if (trimmed === '') return { ok: true, value: null };
  return { ok: true, value: Number(trimmed).toFixed(2) };
}

function hasAnyPrice(mode: PriceMode, dry: string | null, press: string | null, single: string | null): boolean {
  if (mode === 'single') return single != null;
  if (mode === 'dual') return dry != null || press != null;
  return dry != null || press != null || single != null;
}

/** Validate one draft row. Returns null when valid. */
export function validatePriceRowDraft(row: PriceRowDraft): PriceRowValidationError | null {
  if (row.price_mode === 'deferred' && row.is_offered) {
    return {
      catalog_item_id: row.catalog_item_id,
      field: 'is_offered',
      message: `${row.name}: prices are not available yet — turn Offered off or wait for platform rates`,
    };
  }

  const dry = parseOptionalInr(row.dry_clean_inr);
  if (!dry.ok) {
    return { catalog_item_id: row.catalog_item_id, field: 'dry_clean_inr', message: `${row.name}: ${dry.message}` };
  }
  const press = parseOptionalInr(row.press_inr);
  if (!press.ok) {
    return { catalog_item_id: row.catalog_item_id, field: 'press_inr', message: `${row.name}: ${press.message}` };
  }
  const single = parseOptionalInr(row.price_inr);
  if (!single.ok) {
    return { catalog_item_id: row.catalog_item_id, field: 'price_inr', message: `${row.name}: ${single.message}` };
  }

  if (row.price_mode === 'single' && (dry.value != null || press.value != null)) {
    return {
      catalog_item_id: row.catalog_item_id,
      field: 'price_inr',
      message: `${row.name}: use the rate field only`,
    };
  }

  if (row.price_mode === 'dual' && single.value != null) {
    return {
      catalog_item_id: row.catalog_item_id,
      field: 'dry_clean_inr',
      message: `${row.name}: use dry clean / press fields, not a single rate`,
    };
  }

  if (!row.allows_press && press.value != null) {
    return {
      catalog_item_id: row.catalog_item_id,
      field: 'press_inr',
      message: `${row.name}: press is not available for this item`,
    };
  }

  if (row.is_offered && !hasAnyPrice(row.price_mode, dry.value, press.value, single.value)) {
    return {
      catalog_item_id: row.catalog_item_id,
      field: 'is_offered',
      message: `${row.name}: set at least one price when Offered is on`,
    };
  }

  return null;
}

/** Validate a batch of drafts; returns all errors (first failure per row). */
export function validatePriceRowDrafts(rows: PriceRowDraft[]): PriceRowValidationError[] {
  const errors: PriceRowValidationError[] = [];
  for (const row of rows) {
    const error = validatePriceRowDraft(row);
    if (error) errors.push(error);
  }
  return errors;
}

/** Build API upsert payloads from validated drafts. Caller must validate first. */
export function draftsToUpsertPayload(rows: PriceRowDraft[]): PartnerPriceItemUpsert[] {
  return rows.map((row) => {
    const dry = parseOptionalInr(row.dry_clean_inr);
    const press = parseOptionalInr(row.press_inr);
    const single = parseOptionalInr(row.price_inr);
    if (!dry.ok || !press.ok || !single.ok) {
      throw new Error(`Invalid draft for ${row.catalog_item_id}`);
    }

    if (row.price_mode === 'single') {
      return {
        catalog_item_id: row.catalog_item_id,
        price_inr: single.value,
        is_offered: row.is_offered,
      };
    }

    return {
      catalog_item_id: row.catalog_item_id,
      dry_clean_inr: dry.value,
      press_inr: row.allows_press ? press.value : null,
      is_offered: row.is_offered,
    };
  });
}

export function displayInr(value: string | null | undefined): string {
  if (value == null || value === '') return '';
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  return n.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
}
