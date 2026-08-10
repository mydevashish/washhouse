/** Insights list search — min 2 chars for names; allow shorter digit runs for phone. */
export function partnerHubCustomersListSearch(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length >= 4) return trimmed;
  if (trimmed.length >= 2) return trimmed;
  return undefined;
}
