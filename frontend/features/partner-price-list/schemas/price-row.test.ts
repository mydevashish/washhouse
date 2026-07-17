import {
  draftsToUpsertPayload,
  optionalInrSchema,
  validatePriceRowDraft,
  validatePriceRowDrafts,
} from '@/features/partner-price-list/schemas/price-row';
import type { PriceRowDraft } from '@/features/partner-price-list/types';

function baseDraft(overrides: Partial<PriceRowDraft> = {}): PriceRowDraft {
  return {
    catalog_item_id: '11111111-1111-1111-1111-111111111111',
    name: 'Shirt / T-shirt',
    category: 'men',
    unit: 'piece',
    sort_order: 10,
    price_mode: 'dual',
    allows_press: true,
    suggested_dry_clean_inr: '69.00',
    suggested_press_inr: '15.00',
    suggested_price_inr: null,
    dry_clean_inr: '75',
    press_inr: '20',
    price_inr: '',
    is_offered: true,
    ...overrides,
  };
}

describe('optionalInrSchema', () => {
  it('accepts empty and valid INR amounts', () => {
    expect(optionalInrSchema.safeParse('').success).toBe(true);
    expect(optionalInrSchema.safeParse('69').success).toBe(true);
    expect(optionalInrSchema.safeParse('69.5').success).toBe(true);
    expect(optionalInrSchema.safeParse('69.50').success).toBe(true);
  });

  it('rejects invalid or oversized amounts', () => {
    expect(optionalInrSchema.safeParse('abc').success).toBe(false);
    expect(optionalInrSchema.safeParse('12.345').success).toBe(false);
    expect(optionalInrSchema.safeParse('100000').success).toBe(false);
  });
});

describe('validatePriceRowDraft', () => {
  it('requires a price when offered is on', () => {
    const error = validatePriceRowDraft(
      baseDraft({ dry_clean_inr: '', press_inr: '', is_offered: true }),
    );
    expect(error?.field).toBe('is_offered');
    expect(error?.message).toMatch(/at least one price/i);
  });

  it('allows offered off with empty prices', () => {
    expect(
      validatePriceRowDraft(baseDraft({ dry_clean_inr: '', press_inr: '', is_offered: false })),
    ).toBeNull();
  });

  it('rejects press when catalog does not allow it', () => {
    const error = validatePriceRowDraft(
      baseDraft({ allows_press: false, press_inr: '15', dry_clean_inr: '69' }),
    );
    expect(error?.field).toBe('press_inr');
  });

  it('rejects offering deferred items', () => {
    const error = validatePriceRowDraft(
      baseDraft({
        price_mode: 'deferred',
        allows_press: false,
        dry_clean_inr: '',
        press_inr: '',
        is_offered: true,
      }),
    );
    expect(error?.field).toBe('is_offered');
  });

  it('validates single-rate wash rows', () => {
    expect(
      validatePriceRowDraft(
        baseDraft({
          category: 'laundry_by_kg',
          unit: 'kg',
          price_mode: 'single',
          allows_press: false,
          name: 'Wash & Fold',
          dry_clean_inr: '',
          press_inr: '',
          price_inr: '79',
          is_offered: true,
        }),
      ),
    ).toBeNull();

    const missing = validatePriceRowDraft(
      baseDraft({
        price_mode: 'single',
        allows_press: false,
        dry_clean_inr: '',
        press_inr: '',
        price_inr: '',
        is_offered: true,
      }),
    );
    expect(missing?.field).toBe('is_offered');
  });
});

describe('draftsToUpsertPayload', () => {
  it('maps dual and single drafts to API shapes', () => {
    const dual = draftsToUpsertPayload([baseDraft({ dry_clean_inr: '75', press_inr: '20' })]);
    expect(dual[0]).toEqual({
      catalog_item_id: '11111111-1111-1111-1111-111111111111',
      dry_clean_inr: '75.00',
      press_inr: '20.00',
      is_offered: true,
    });

    const single = draftsToUpsertPayload([
      baseDraft({
        price_mode: 'single',
        allows_press: false,
        dry_clean_inr: '',
        press_inr: '',
        price_inr: '109',
      }),
    ]);
    expect(single[0]).toEqual({
      catalog_item_id: '11111111-1111-1111-1111-111111111111',
      price_inr: '109.00',
      is_offered: true,
    });
  });

  it('collects multiple validation errors', () => {
    const errors = validatePriceRowDrafts([
      baseDraft({ dry_clean_inr: '', press_inr: '', is_offered: true }),
      baseDraft({
        catalog_item_id: '22222222-2222-2222-2222-222222222222',
        name: 'Cap',
        allows_press: false,
        press_inr: '10',
        dry_clean_inr: '39',
      }),
    ]);
    expect(errors).toHaveLength(2);
  });
});
