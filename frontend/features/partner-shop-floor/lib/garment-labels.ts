/**
 * Short bilingual labels for Cloth Wall tiles (English primary in UI).
 */

const SLUG_LABELS: Record<string, { hinglish: string; english: string }> = {
  'men-shirt-tshirt': { hinglish: 'Shirt', english: 'Shirt / T-shirt' },
  'men-trouser': { hinglish: 'Pant', english: 'Trouser' },
  'men-kurta': { hinglish: 'Kurta', english: 'Kurta' },
  'men-shorts': { hinglish: 'Shorts', english: 'Shorts' },
  'men-coat-formal': { hinglish: 'Coat', english: 'Formal coat' },
  'women-saree-normal': { hinglish: 'Saree', english: 'Saree' },
  'women-saree-heavy': { hinglish: 'Saree (heavy)', english: 'Heavy saree' },
  'women-kurti': { hinglish: 'Kurti', english: 'Kurti' },
  'women-blouse-choli-normal': { hinglish: 'Blouse', english: 'Blouse' },
  'women-lehenga-normal': { hinglish: 'Lehenga', english: 'Lehenga' },
  'women-dress-normal': { hinglish: 'Dress', english: 'Dress' },
  'kids-shirt-tshirt': { hinglish: 'Kids shirt', english: 'Kids shirt' },
  'kids-frock-normal': { hinglish: 'Frock', english: 'Frock' },
  'winter-sweater-men-women': { hinglish: 'Sweater', english: 'Sweater' },
  'winter-jacket-denim': { hinglish: 'Jacket', english: 'Denim jacket' },
  'winter-hoodie': { hinglish: 'Hoodie', english: 'Hoodie' },
  'household-bedsheet-single': { hinglish: 'Bedsheet', english: 'Bedsheet' },
  'household-blanket': { hinglish: 'Blanket', english: 'Blanket' },
  'kg-wash-fold': { hinglish: 'Wash & Fold', english: 'Wash & Fold / kg' },
};

function shortenEnglishName(name: string): string {
  const trimmed = name.trim();
  const beforeParen = trimmed.split('(')[0]?.trim() ?? trimmed;
  const beforeSlash = beforeParen.split('/')[0]?.trim() ?? beforeParen;
  return beforeSlash.slice(0, 22);
}

/** Short label + English subtitle for a catalog / service row. */
export function garmentDisplayLabel(
  slug: string | null | undefined,
  name: string,
): { hinglish: string; english: string } {
  if (slug && SLUG_LABELS[slug]) {
    return SLUG_LABELS[slug];
  }
  const short = shortenEnglishName(name);
  return { hinglish: short, english: name };
}
