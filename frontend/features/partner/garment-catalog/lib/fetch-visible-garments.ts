import {
  listPartnerGarments,
  type GarmentCatalogItem,
} from '@/services/partner-garment-catalog';

/** Load all visible garment catalog rows for Cloth Wall (paginated client fetch). */
export async function fetchVisibleGarmentCatalogItems(): Promise<GarmentCatalogItem[]> {
  const items: GarmentCatalogItem[] = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const data = await listPartnerGarments({ page, page_size: 100 });
    for (const item of data.items) {
      if (item.is_visible) items.push(item);
    }
    hasNext = data.has_next;
    page += 1;
  }

  return items;
}
