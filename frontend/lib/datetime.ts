/** India marketplace — fixed TZ so SSR (UTC) and browser (IST) match. */
export const INDIA_TIME_ZONE = 'Asia/Kolkata';

const DATE_TIME: Intl.DateTimeFormatOptions = {
  timeZone: INDIA_TIME_ZONE,
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
};

const DELIVERY: Intl.DateTimeFormatOptions = {
  timeZone: INDIA_TIME_ZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
};

const DATE_ONLY: Intl.DateTimeFormatOptions = {
  timeZone: INDIA_TIME_ZONE,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
};

const DATE_SHORT: Intl.DateTimeFormatOptions = {
  timeZone: INDIA_TIME_ZONE,
  day: 'numeric',
  month: 'short',
};

export function formatIndiaDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', DATE_TIME);
}

export function formatIndiaDelivery(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', DELIVERY);
}

export function formatIndiaDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', DATE_ONLY);
}

/** Chart axis / compact labels (YYYY-MM-DD date strings). */
export function formatIndiaShortDate(dateYmd: string): string {
  return new Date(`${dateYmd}T12:00:00`).toLocaleDateString('en-IN', DATE_SHORT);
}
