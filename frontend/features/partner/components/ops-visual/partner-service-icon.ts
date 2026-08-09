import { Layers, Package, Shirt, Sparkles, Wind, type LucideIcon } from 'lucide-react';

/** Map catalog category text to a consistent tile icon (no catalog thumb in API v1). */
export function partnerServiceCategoryIcon(category: string): LucideIcon {
  const c = category.toLowerCase();
  if (c.includes('dry')) return Sparkles;
  if (c.includes('iron') || c.includes('press')) return Wind;
  if (c.includes('fold') || c.includes('pack')) return Package;
  if (c.includes('premium') || c.includes('special')) return Layers;
  return Shirt;
}
