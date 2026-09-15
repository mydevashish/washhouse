export function stripTagCodeNoise(value: string): string {
  return value
    .replace(/\s*[·•|-]\s*(?:g(?:code)?|gc|code)\s*[-_ ]?[A-Za-z0-9-]*$/gi, '')
    .replace(/\b(?:g(?:code)?|gc|code)\s*[-_ ]?[A-Za-z0-9-]*\b/gi, '')
    .replace(/\b(?:kg|kilogram|kilograms)\b/gi, '')
    .replace(/\s*\/\s*kg\b/gi, '')
    .replace(/\s*[·•]\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function normalizeTagServiceLabel(value: string): string {
  const cleaned = stripTagCodeNoise(value ?? '').replace(/\s*\/\s*$/g, '');
  return cleaned.replace(/\s*\/\s*/g, ' / ').trim();
}

export function getServiceShortCode(value: string): string {
  const normalized = normalizeTagServiceLabel(value ?? '').toLowerCase();

  if (normalized.includes('wash') && normalized.includes('fold')) return 'WF';
  if (normalized.includes('wash') && normalized.includes('iron')) return 'WI';
  if (normalized.includes('dry') && normalized.includes('clean')) return 'DC';
  if (normalized.includes('press')) return 'SP';

  if (!normalized) return 'ITEM';

  const compact = normalized
    .replace(/[^a-z]/g, '')
    .slice(0, 2)
    .toUpperCase();

  return compact || 'ITEM';
}

export function getTagCountLabel(tag: {
  qty_index?: string | null;
  piece_index?: number | null;
  piece_total?: number | null;
}): string {
  if (tag.piece_index != null && tag.piece_total) {
    return `${tag.piece_index}/${tag.piece_total}`;
  }
  if (tag.qty_index) {
    return tag.qty_index;
  }
  return '';
}
