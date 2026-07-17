'use client';

import { useQuery } from '@tanstack/react-query';
import { IndianRupee, ListOrdered } from 'lucide-react';

import { QueryErrorState } from '@/components/feedback/query-error-state';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { formatUnitPrice } from '@/features/discover/detail/service-icons';
import { getLaundryPriceList } from '@/features/laundry-price-list/api/laundry-price-list';
import { PriceListCategoryTable } from '@/features/laundry-price-list/components/price-list-category-table';
import { groupPriceListByCategory } from '@/features/laundry-price-list/lib/group-categories';
import type { LaundryServiceItem } from '@/services/laundries';
import { STALE } from '@/lib/query-config';
import { queryKeys } from '@/lib/query-keys';
import { getApiErrorMessage } from '@/lib/api-error-message';

type LaundryPriceListSectionProps = {
  laundryId: string;
  /** Existing laundry_services to show when the garment list is empty. */
  services?: LaundryServiceItem[];
  onBook?: () => void;
  bookLabel?: string;
  headingId?: string;
  className?: string;
};

export function LaundryPriceListSection({
  laundryId,
  services = [],
  onBook,
  bookLabel = 'Book pickup',
  headingId = 'price-list-heading',
  className,
}: LaundryPriceListSectionProps) {
  const priceQ = useQuery({
    queryKey: queryKeys.laundryPriceList(laundryId),
    queryFn: () => getLaundryPriceList(laundryId),
    staleTime: STALE.laundryDetail,
  });

  if (priceQ.isLoading) {
    return (
      <div className={className} aria-busy="true" aria-label="Loading price list">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="mb-3 h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (priceQ.isError) {
    return (
      <div className={className}>
        <QueryErrorState
          title="Could not load price list"
          message={getApiErrorMessage(priceQ.error, 'Check your connection and try again.')}
          onRetry={() => void priceQ.refetch()}
        />
      </div>
    );
  }

  const data = priceQ.data;
  const groups = groupPriceListByCategory(data?.items ?? []);
  const activeServices = services.filter((s) => s.is_active);

  return (
    <div className={className}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id={headingId} className="text-xl font-bold text-foreground">
            Price list
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Prices set by this store, in Indian rupees (₹). Dry clean and press shown when offered.
          </p>
        </div>
        {onBook && (
          <Button type="button" size="lg" className="shrink-0" onClick={onBook}>
            {bookLabel}
          </Button>
        )}
      </div>

      {!data?.has_published_list ? (
        <div className="space-y-6">
          <EmptyState
            icon={ListOrdered}
            title="This store hasn’t published a full price list yet"
            description="Ask the shop for garment rates, or browse the services they already list below."
          />
          {activeServices.length > 0 && (
            <section aria-labelledby="fallback-services-heading">
              <h3 id="fallback-services-heading" className="mb-3 text-base font-semibold">
                Current services
              </h3>
              <ul className="divide-y divide-border rounded-xl border border-border">
                {activeServices.map((svc) => (
                  <li
                    key={svc.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <span className="font-medium text-foreground">{svc.name}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatUnitPrice(svc.price_inr, svc.unit)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {onBook && (
            <Button type="button" size="lg" className="w-full sm:w-auto" onClick={onBook}>
              {bookLabel}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <PriceListCategoryTable key={group.category} group={group} />
          ))}
          {onBook && (
            <div className="flex flex-col gap-2 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <IndianRupee className="h-4 w-4 shrink-0" aria-hidden />
                Ready to schedule pickup with this store?
              </p>
              <Button type="button" size="lg" onClick={onBook}>
                {bookLabel}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
