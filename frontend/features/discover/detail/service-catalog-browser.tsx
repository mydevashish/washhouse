'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Filter, Search, Store, Zap } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ServiceCard } from '@/features/discover/detail/service-card';
import { ServiceCategoryChips } from '@/features/discover/detail/service-category-chips';
import { groupServicesByCategory } from '@/features/discover/detail/lib/group-services-by-category';
import {
  normalizeServiceCategory,
  serviceCategorySectionId,
} from '@/features/discover/detail/lib/normalize-service-category';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';
import { useSectionScrollSpy } from '@/lib/navigation/use-section-scroll-spy';
import type { LaundryServiceItem } from '@/services/laundries';
import {
  browseServiceCatalog,
  type ServiceCatalogItem,
  type ServiceSort,
} from '@/services/customer-experience';

type Props = {
  laundryId: string;
  quantities: Record<string, number>;
  onSelect: (svc: LaundryServiceItem) => void;
  onIncrement: (svc: LaundryServiceItem) => void;
  onDecrement: (svc: LaundryServiceItem) => void;
  onQuantityChange: (svc: LaundryServiceItem, qty: number) => void;
  browseOnly?: boolean;
};

function toServiceItem(s: ServiceCatalogItem): LaundryServiceItem {
  return {
    id: s.id,
    name: s.name,
    category: s.category,
    unit: s.unit,
    price_inr: s.price_inr,
    is_active: s.is_active,
    description: s.description,
    estimated_duration_minutes: s.estimated_duration_minutes,
    express_available: s.express_available,
    pickup_available: s.pickup_available,
    delivery_available: s.delivery_available,
    view_count: s.view_count,
    order_count: s.order_count,
  };
}

function scrollToCategory(category: string, behavior: ScrollBehavior) {
  const el = document.getElementById(serviceCategorySectionId(category));
  el?.scrollIntoView({ behavior, block: 'start' });
}

export function ServiceCatalogBrowser({
  laundryId,
  quantities,
  onSelect,
  onIncrement,
  onDecrement,
  onQuantityChange,
  browseOnly = false,
}: Props) {
  const reduceMotion = usePrefersReducedMotion();
  const deepLinked = useRef(false);

  const [q, setQ] = useState('');
  const [expressOnly, setExpressOnly] = useState(false);
  const [sort, setSort] = useState<ServiceSort>('popular');

  const catalogQ = useQuery({
    queryKey: ['service-catalog', laundryId, q, expressOnly, sort],
    queryFn: () =>
      browseServiceCatalog(laundryId, {
        q: q || undefined,
        express_only: expressOnly,
        sort,
      }),
    staleTime: 30_000,
  });

  const services = useMemo(
    () => (catalogQ.data ?? []).map(toServiceItem),
    [catalogQ.data],
  );

  const groups = useMemo(() => groupServicesByCategory(services), [services]);

  const sectionIds = useMemo(
    () => groups.map((g) => serviceCategorySectionId(g.category)),
    [groups],
  );

  const activeSectionId = useSectionScrollSpy(sectionIds, {
    enabled: groups.length > 1 && !catalogQ.isLoading,
    rootMargin: '-25% 0px -55% 0px',
  });

  const activeCategory = useMemo(() => {
    if (!activeSectionId) return groups[0]?.category ?? null;
    const match = groups.find((g) => serviceCategorySectionId(g.category) === activeSectionId);
    return match?.category ?? groups[0]?.category ?? null;
  }, [activeSectionId, groups]);

  const chips = useMemo(
    () =>
      groups.map((g) => ({
        id: g.category,
        label: g.label,
        count: g.services.length,
      })),
    [groups],
  );

  const handleChipSelect = useCallback(
    (category: string) => {
      scrollToCategory(category, reduceMotion ? 'auto' : 'smooth');
    },
    [reduceMotion],
  );

  // Optional deep-link: ?category=dry_clean | dry-clean
  useEffect(() => {
    if (deepLinked.current || catalogQ.isLoading || groups.length === 0) return;
    if (typeof window === 'undefined') return;
    const raw = new URLSearchParams(window.location.search).get('category');
    if (!raw) return;
    const key = normalizeServiceCategory(raw);
    const exists = groups.some((g) => g.category === key);
    if (!exists) return;
    deepLinked.current = true;
    const t = window.setTimeout(() => {
      scrollToCategory(key, reduceMotion ? 'auto' : 'smooth');
    }, 80);
    return () => window.clearTimeout(t);
  }, [catalogQ.isLoading, groups, reduceMotion]);

  const hasFilters = Boolean(q.trim()) || expressOnly;
  const resultsLabel =
    services.length === 1 ? '1 service' : `${services.length} services`;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search this store’s services…"
              className="pl-9"
              aria-label="Search services in this store"
              aria-controls="store-service-results"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as ServiceSort)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            aria-label="Sort services"
          >
            <option value="popular">Popular</option>
            <option value="price_asc">Price: Low to high</option>
            <option value="price_desc">Price: High to low</option>
          </select>
          <Button
            type="button"
            size="sm"
            variant={expressOnly ? 'default' : 'outline'}
            className="gap-1.5"
            onClick={() => setExpressOnly((v) => !v)}
            aria-pressed={expressOnly}
          >
            <Zap className="h-3.5 w-3.5" aria-hidden />
            Express
          </Button>
        </div>
        <p
          id="store-service-results"
          className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"
          aria-live="polite"
          aria-atomic="true"
        >
          <Filter className="h-3 w-3" aria-hidden />
          {catalogQ.isLoading ? 'Loading services…' : resultsLabel}
          {hasFilters ? ' matching your search' : ''}
          {browseOnly ? ' · Prices in INR' : ' · Add services to schedule pickup'}
        </p>
      </div>

      <ServiceCategoryChips
        chips={chips}
        activeId={activeCategory}
        onSelect={handleChipSelect}
      />

      {catalogQ.isLoading && (
        <div className="grid gap-4 sm:grid-cols-2" aria-busy="true" aria-label="Loading services">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      )}

      {!catalogQ.isLoading && services.length === 0 && !hasFilters && (
        <EmptyState
          icon={Store}
          title="This store hasn’t listed services yet"
          description="Browse other verified laundries on WashHouse to find wash & fold, dry clean, and ironing near you."
          action={{ label: 'Back to stores', href: '/stores' }}
        />
      )}

      {!catalogQ.isLoading && services.length === 0 && hasFilters && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="font-medium text-foreground">No services match your search</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try a different keyword, or clear filters to see the full catalogue.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => {
              setQ('');
              setExpressOnly(false);
            }}
          >
            Clear search & filters
          </Button>
        </div>
      )}

      {!catalogQ.isLoading && groups.length > 0 && (
        <div className="space-y-10">
          {groups.map((group) => (
            <section
              key={group.category}
              id={serviceCategorySectionId(group.category)}
              aria-labelledby={`heading-${serviceCategorySectionId(group.category)}`}
              className="scroll-mt-28"
            >
              <h3
                id={`heading-${serviceCategorySectionId(group.category)}`}
                className="mb-4 text-base font-semibold text-foreground sm:text-lg"
              >
                {group.label}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({group.services.length})
                </span>
              </h3>
              <ul className="grid gap-6 sm:grid-cols-2">
                {group.services.map((svc) => (
                  <li key={svc.id}>
                    <ServiceCard
                      service={svc}
                      quantity={quantities[svc.id] ?? 0}
                      onSelect={() => onSelect(svc)}
                      onIncrement={() => onIncrement(svc)}
                      onDecrement={() => onDecrement(svc)}
                      onQuantityChange={(qty) => onQuantityChange(svc, qty)}
                      browseOnly={browseOnly}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
