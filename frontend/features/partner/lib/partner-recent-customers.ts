/**
 * Recent customers strip (P4) — last phones served today.
 * localStorage-backed until a dedicated API exists.
 */

export const PARTNER_RECENT_CUSTOMERS_KEY = 'dlm.partner_recent_customers';
export const PARTNER_RECENT_CUSTOMERS_MAX = 8;

export type PartnerRecentCustomer = {
  phone: string;
  name: string | null;
  /** ISO timestamp when last opened / served. */
  at: string;
};

/** Calendar day in Asia/Kolkata as YYYY-MM-DD. */
export function kolkataDayKey(now: Date = new Date()): string {
  return now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function dayKeyFromIso(iso: string): string | null {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return kolkataDayKey(new Date(t));
}

function normalizePhoneKey(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

export function readRecentCustomersRaw(): PartnerRecentCustomer[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(PARTNER_RECENT_CUSTOMERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (row): row is PartnerRecentCustomer =>
          Boolean(row) &&
          typeof row === 'object' &&
          typeof (row as PartnerRecentCustomer).phone === 'string' &&
          typeof (row as PartnerRecentCustomer).at === 'string',
      )
      .map((row) => ({
        phone: row.phone,
        name: typeof row.name === 'string' ? row.name : null,
        at: row.at,
      }));
  } catch {
    return [];
  }
}

/** Today’s recent phones (Kolkata day), newest first, max 8. */
export function readRecentCustomersToday(now: Date = new Date()): PartnerRecentCustomer[] {
  const today = kolkataDayKey(now);
  const seen = new Set<string>();
  const out: PartnerRecentCustomer[] = [];
  for (const row of readRecentCustomersRaw()) {
    if (dayKeyFromIso(row.at) !== today) continue;
    const key = normalizePhoneKey(row.phone);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(row);
    if (out.length >= PARTNER_RECENT_CUSTOMERS_MAX) break;
  }
  return out;
}

export function rememberRecentCustomer(
  entry: { phone: string; name?: string | null },
  now: Date = new Date(),
): PartnerRecentCustomer[] {
  const phone = entry.phone.trim();
  if (!phone || normalizePhoneKey(phone).length < 10) {
    return readRecentCustomersToday(now);
  }

  const next: PartnerRecentCustomer = {
    phone,
    name: entry.name?.trim() || null,
    at: now.toISOString(),
  };
  const key = normalizePhoneKey(phone);
  const rest = readRecentCustomersRaw().filter((row) => normalizePhoneKey(row.phone) !== key);
  const merged = [next, ...rest].slice(0, PARTNER_RECENT_CUSTOMERS_MAX * 3);

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(PARTNER_RECENT_CUSTOMERS_KEY, JSON.stringify(merged));
    } catch {
      /* quota / private mode — ignore */
    }
  }

  return readRecentCustomersToday(now);
}
