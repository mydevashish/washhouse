'use client';

import {
  formatRupee,
  rupeeAriaLabel,
} from '@/features/laundry-price-list/lib/format-inr';
import { CatalogGarmentThumb } from '@/features/laundry-price-list/components/catalog-garment-thumb';
import type { CategoryGroup } from '@/features/laundry-price-list/lib/group-categories';
import { resolvePriceListItemPhoto } from '@/features/laundry-price-list/lib/resolve-item-photo';
import { PRICE_LIST_CATEGORY_LABELS } from '@/features/laundry-price-list/types';
import { cn } from '@/lib/utils';

type PriceListCategoryTableProps = {
  group: CategoryGroup;
  className?: string;
};

export function PriceListCategoryTable({ group, className }: PriceListCategoryTableProps) {
  const headingId = `price-cat-${group.category}`;
  const label = PRICE_LIST_CATEGORY_LABELS[group.category];
  const { showDryClean, showPress, showSingleRate } = group;

  const primaryHeader = showSingleRate && !showDryClean && !showPress ? 'Rate' : 'Dry clean';
  const showPrimary = showSingleRate || showDryClean;

  return (
    <section className={cn('space-y-3', className)} aria-labelledby={headingId}>
      <h3 id={headingId} className="text-base font-semibold text-foreground sm:text-lg">
        {label}
      </h3>
      <div className="-mx-1 overflow-x-auto sm:mx-0">
        <table className="w-full min-w-[18rem] border-collapse text-left text-sm">
          <caption className="sr-only">
            {label} prices in Indian rupees
          </caption>
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th scope="col" className="py-2 pr-3 font-medium">
                Item
              </th>
              {showPrimary && (
                <th scope="col" className="py-2 px-2 text-right font-medium tabular-nums">
                  {primaryHeader}
                </th>
              )}
              {showPress && (
                <th scope="col" className="py-2 pl-2 text-right font-medium tabular-nums">
                  Press
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {group.items.map((item) => {
              const primaryValue = showSingleRate && item.price_inr != null
                ? item.price_inr
                : item.dry_clean_inr;
              const photo = resolvePriceListItemPhoto(item.slug, item.name, item.category);
              return (
                <tr key={item.catalog_item_id} className="border-b border-border/60 last:border-0">
                  <th
                    scope="row"
                    className="py-2.5 pr-3 font-medium text-foreground"
                  >
                    <span className="flex items-center gap-2.5">
                      <CatalogGarmentThumb photo={photo} />
                      <span>
                        {item.name}
                        {item.unit === 'kg' && (
                          <span className="ml-1 text-xs font-normal text-muted-foreground">
                            /kg
                          </span>
                        )}
                      </span>
                    </span>
                  </th>
                  {showPrimary && (
                    <td className="py-2.5 px-2 text-right tabular-nums text-foreground">
                      <span aria-label={rupeeAriaLabel(primaryValue)}>
                        {formatRupee(primaryValue)}
                      </span>
                    </td>
                  )}
                  {showPress && (
                    <td className="py-2.5 pl-2 text-right tabular-nums text-foreground">
                      <span aria-label={rupeeAriaLabel(item.press_inr)}>
                        {formatRupee(item.press_inr)}
                      </span>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
