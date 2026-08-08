export const PARTNER_UI_MODES = ['shop_floor', 'advanced'] as const;

export type PartnerUiMode = (typeof PARTNER_UI_MODES)[number];

export const DEFAULT_PARTNER_UI_MODE: PartnerUiMode = 'shop_floor';

export const PARTNER_UI_MODE_STORAGE_KEY = 'dlm.partner_ui_mode';

/** Training flag — banner only; APIs still hit seed/staging (see docs/qa). */
export const PARTNER_PRACTICE_MODE_STORAGE_KEY = 'dlm.partner_practice_mode';

/** Opt-in Web Speech one-liners on success / print (Shop Floor). */
export const PARTNER_FLOOR_VOICE_STORAGE_KEY = 'dlm.partner_floor_voice_prompts';

/**
 * Completed walk-in creates on this device — coach mark shows while count &lt; 3.
 * Key: `dlm.partner_floor_coach_orders`
 */
export const PARTNER_FLOOR_COACH_ORDERS_KEY = 'dlm.partner_floor_coach_orders';

/** Coach mark shows for the first N successful creates on this device. */
export const PARTNER_FLOOR_COACH_ORDER_LIMIT = 3;

export function isPartnerUiMode(value: unknown): value is PartnerUiMode {
  return value === 'shop_floor' || value === 'advanced';
}
