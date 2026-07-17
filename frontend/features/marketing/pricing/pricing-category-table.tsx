import { PRICE_LIST_CATEGORY_LABELS } from '@/features/laundry-price-list/types';
import {
  formatFromRupee,
  fromRupeeAriaLabel,
} from '@/features/marketing/pricing/lib/format-from-inr';
import type { PricingFromGroup } from '@/features/marketing/pricing/lib/group-from-categories';
import { cn } from '@/lib/utils';

type PricingCategoryTableProps = {
  group: PricingFromGroup;
  className?: string;
};

/**
 * Static category price table — used for `prefers-reduced-motion: reduce`.
 * Uses atelier ink tokens so contrast stays readable on the laundry backdrop.
 */
export function PricingCategoryTable({ group, className }: PricingCategoryTableProps) {
  const headingId = `pricing-cat-${group.category}`;
  const label = PRICE_LIST_CATEGORY_LABELS[group.category];
  const { showDryClean, showPress, showSingleRate } = group;

  const primaryHeader =
    showSingleRate && !showDryClean && !showPress ? 'Rate' : 'Dry clean';
  const showPrimary = showSingleRate || showDryClean;

  return (
    <section className={cn('space-y-3', className)} aria-labelledby={headingId}>
      <h3
        id={headingId}
        className="text-base font-semibold sm:text-lg"
        style={{ color: 'var(--atelier-ink)' }}
      >
        {label}
      </h3>
      <div className="w-full max-w-full overflow-x-auto overscroll-x-contain">
        <table className="w-full min-w-0 border-collapse text-left text-sm sm:min-w-[18rem]">
          <caption className="sr-only">
            {label} starting-from indicative prices in Indian rupees
          </caption>
          <thead>
            <tr
              className="border-b"
              style={{ borderColor: 'var(--atelier-tag-edge, var(--border))', color: 'var(--atelier-muted)' }}
            >
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
              const primaryValue =
                showSingleRate && item.from_price_inr != null
                  ? item.from_price_inr
                  : item.from_dry_clean_inr;
              return (
                <tr
                  key={item.catalog_item_id}
                  className="border-b last:border-0"
                  style={{ borderColor: 'color-mix(in srgb, var(--atelier-tag-edge, currentColor) 55%, transparent)' }}
                >
                  <th
                    scope="row"
                    className="py-2.5 pr-3 font-medium"
                    style={{ color: 'var(--atelier-ink)' }}
                  >
                    {item.name}
                    {item.unit === 'kg' && (
                      <span
                        className="ml-1 text-xs font-normal"
                        style={{ color: 'var(--atelier-muted)' }}
                      >
                        /kg
                      </span>
                    )}
                  </th>
                  {showPrimary && (
                    <td
                      className="py-2.5 px-2 text-right tabular-nums"
                      style={{ color: 'var(--atelier-ink)' }}
                    >
                      <span aria-label={fromRupeeAriaLabel(primaryValue)}>
                        {formatFromRupee(primaryValue)}
                      </span>
                    </td>
                  )}
                  {showPress && (
                    <td
                      className="py-2.5 pl-2 text-right tabular-nums"
                      style={{ color: 'var(--atelier-ink)' }}
                    >
                      <span aria-label={fromRupeeAriaLabel(item.from_press_inr)}>
                        {formatFromRupee(item.from_press_inr)}
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
