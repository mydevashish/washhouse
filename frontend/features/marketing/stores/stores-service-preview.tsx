import { CatalogGarmentThumb } from '@/features/laundry-price-list/components/catalog-garment-thumb';
import { formatRupee } from '@/features/laundry-price-list/lib/format-inr';
import { resolvePriceListItemPhoto } from '@/features/laundry-price-list/lib/resolve-item-photo';
import {
  getComparePriceLines,
  comparePriceAriaSummary,
} from '@/features/discover/lib/compare-price-lines';
import type { LaundryListItem } from '@/services/laundries';
import { cn } from '@/lib/utils';

/** Shared WashHouse service categories — shown when no owner price hints exist. */
const CATEGORY_CHIPS = ['Wash & Fold', 'Dry Clean', 'Ironing', 'Express'] as const;

type StoresServicePreviewProps = {
  laundry: LaundryListItem;
  className?: string;
};

/**
 * “What they serve” strip for marketing store cards.
 * Real “from ₹X” only when list API compare hints exist; otherwise category chips (no fake prices).
 */
export function StoresServicePreview({ laundry, className }: StoresServicePreviewProps) {
  const priceLines = getComparePriceLines(laundry);
  const priceAria = comparePriceAriaSummary(laundry);
  const startFrom =
    !priceLines.length && laundry.start_price_inr
      ? formatRupee(laundry.start_price_inr)
      : null;

  if (priceLines.length > 0) {
    return (
      <ul
        className={cn('flex flex-wrap gap-2', className)}
        aria-label={priceAria ?? 'Service prices'}
      >
        {priceLines.map((line) => {
          const photo = resolvePriceListItemPhoto(line.slug, line.name, line.category);
          return (
            <li
              key={line.key}
              className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-muted/70 px-2 py-1 text-xs text-muted-foreground ring-1 ring-border/50"
            >
              <CatalogGarmentThumb photo={photo} />
              <span className="min-w-0 truncate">
                <span className="font-semibold text-foreground">from {line.amountLabel}</span>
                {line.unitSuffix ? (
                  <span className="font-medium text-muted-foreground">{line.unitSuffix}</span>
                ) : null}{' '}
                <span>{line.label}</span>
              </span>
            </li>
          );
        })}
      </ul>
    );
  }

  if (startFrom) {
    return (
      <p className={cn('text-sm text-muted-foreground', className)} aria-label={`from ${startFrom}`}>
        <span className="inline-flex items-center rounded-lg bg-muted/70 px-2.5 py-1 text-xs ring-1 ring-border/50">
          <span className="font-semibold text-foreground">from {startFrom}</span>
          <span className="ml-1">· see full menu in store</span>
        </span>
      </p>
    );
  }

  return (
    <ul
      className={cn('flex flex-wrap gap-1.5', className)}
      aria-label="WashHouse services available"
    >
      {CATEGORY_CHIPS.map((label) => (
        <li
          key={label}
          className="rounded-md bg-brand-50 px-2 py-1 text-[11px] font-semibold tracking-wide text-brand-600 dark:bg-brand-900/40 dark:text-brand-50"
        >
          {label}
        </li>
      ))}
    </ul>
  );
}
