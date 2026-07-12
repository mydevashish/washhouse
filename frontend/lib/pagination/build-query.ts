import type { ListQueryParams } from './types';

export function buildListQueryParams(
  params: Record<string, string | number | boolean | undefined | null>,
): ListQueryParams {
  const out: ListQueryParams = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    out[key] = value;
  }
  return out;
}

export function toSearchParams(params: Record<string, string | number | boolean | undefined | null>): URLSearchParams {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(buildListQueryParams(params))) {
    sp.set(key, String(value));
  }
  return sp;
}
