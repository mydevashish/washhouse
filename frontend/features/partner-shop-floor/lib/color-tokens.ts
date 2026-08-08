/** Shop Floor bag color tokens — letters match backend COLOR_TOKEN_LETTERS. */

export const COLOR_TOKENS = [
  'red',
  'blue',
  'green',
  'yellow',
  'orange',
  'purple',
  'pink',
  'teal',
  'brown',
  'grey',
] as const;

export type ColorTokenKey = (typeof COLOR_TOKENS)[number];

/** Color-blind safe pattern — never rely on hue alone (stripe / dots / hatch). */
export type ColorTokenPattern = 'stripes-h' | 'stripes-v' | 'stripes-d' | 'dots' | 'dots-dense' | 'hatch';

export const COLOR_TOKEN_LETTERS: Record<ColorTokenKey, string> = {
  red: 'R',
  blue: 'B',
  green: 'G',
  yellow: 'Y',
  orange: 'O',
  purple: 'P',
  pink: 'K',
  teal: 'T',
  brown: 'W',
  grey: 'E',
};

export const COLOR_TOKEN_LABELS: Record<ColorTokenKey, { en: string; hinglish: string }> = {
  red: { en: 'Red', hinglish: 'Lal' },
  blue: { en: 'Blue', hinglish: 'Neela' },
  green: { en: 'Green', hinglish: 'Hara' },
  yellow: { en: 'Yellow', hinglish: 'Peela' },
  orange: { en: 'Orange', hinglish: 'Narangi' },
  purple: { en: 'Purple', hinglish: 'Baingani' },
  pink: { en: 'Pink', hinglish: 'Gulabi' },
  teal: { en: 'Teal', hinglish: 'Harrā-neela' },
  brown: { en: 'Brown', hinglish: 'Bhura' },
  grey: { en: 'Grey', hinglish: 'Slehri' },
};

/** Distinct pattern per color so color-blind staff can tell bags apart. */
export const COLOR_TOKEN_PATTERNS: Record<ColorTokenKey, ColorTokenPattern> = {
  red: 'stripes-h',
  blue: 'dots',
  green: 'stripes-d',
  yellow: 'stripes-v',
  orange: 'hatch',
  purple: 'dots-dense',
  pink: 'stripes-h',
  teal: 'stripes-d',
  brown: 'stripes-v',
  grey: 'dots',
};

export const COLOR_TOKEN_HEX: Record<ColorTokenKey, string> = {
  red: '#dc2626',
  blue: '#2563eb',
  green: '#16a34a',
  yellow: '#ca8a04',
  orange: '#ea580c',
  purple: '#7c3aed',
  pink: '#db2777',
  teal: '#0d9488',
  brown: '#92400e',
  grey: '#4b5563',
};

/** CSS background-image overlays (white semi-transparent) for print + screen. */
export function colorTokenPatternCss(pattern: ColorTokenPattern): string {
  switch (pattern) {
    case 'stripes-h':
      return 'repeating-linear-gradient(0deg, transparent 0 3px, rgba(255,255,255,0.45) 3px 6px)';
    case 'stripes-v':
      return 'repeating-linear-gradient(90deg, transparent 0 3px, rgba(255,255,255,0.45) 3px 6px)';
    case 'stripes-d':
      return 'repeating-linear-gradient(45deg, transparent 0 4px, rgba(255,255,255,0.4) 4px 8px)';
    case 'dots':
      return 'radial-gradient(circle, rgba(255,255,255,0.55) 1.5px, transparent 1.6px)';
    case 'dots-dense':
      return 'radial-gradient(circle, rgba(255,255,255,0.55) 1.2px, transparent 1.3px)';
    case 'hatch':
      return [
        'repeating-linear-gradient(45deg, transparent 0 3px, rgba(255,255,255,0.35) 3px 5px)',
        'repeating-linear-gradient(-45deg, transparent 0 3px, rgba(255,255,255,0.25) 3px 5px)',
      ].join(', ');
    default:
      return 'none';
  }
}

export function colorTokenPatternSize(pattern: ColorTokenPattern): string | undefined {
  if (pattern === 'dots') return '8px 8px';
  if (pattern === 'dots-dense') return '6px 6px';
  return undefined;
}

export function isColorTokenKey(value: string | null | undefined): value is ColorTokenKey {
  return Boolean(value && (COLOR_TOKENS as readonly string[]).includes(value));
}

export const TAG_PER_PIECE_STORAGE_KEY = 'dlm.partner_tag_per_piece';

export function readTagPerPieceSetting(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(TAG_PER_PIECE_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeTagPerPieceSetting(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(TAG_PER_PIECE_STORAGE_KEY, enabled ? '1' : '0');
  } catch {
    /* ignore */
  }
}
