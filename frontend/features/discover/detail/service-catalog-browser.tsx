'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Filter, Search, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ServiceCard } from '@/features/discover/detail/service-card';
import type { LaundryServiceItem } from '@/services/laundries';
import {
  browseServiceCatalog,
  listServiceCategories,
  type ServiceCatalogItem,
  type ServiceSort,
} from '@/services/customer-experience';
import { cn } from '@/lib/utils';

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

export function ServiceCatalogBrowser({
  laundryId,
  quantities,
  onSelect,
  onIncrement,
  onDecrement,
  onQuantityChange,
  browseOnly = false,
}: Props) {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [expressOnly, setExpressOnly] = useState(false);
  const [sort, setSort] = useState<ServiceSort>('popular');

  const categoriesQ = useQuery({
    queryKey: ['service-categories'],
    queryFn: listServiceCategories,
    staleTime: 300_000,
  });

  const catalogQ = useQuery({
    queryKey: ['service-catalog', laundryId, q, category, expressOnly, sort],
    queryFn: () =>
      browseServiceCatalog(laundryId, {
        q: q || undefined,
        category: category || undefined,
        express_only: expressOnly,
        sort,
      }),
    staleTime: 30_000,
  });

  const services = useMemo(
    () => (catalogQ.data ?? []).map(toServiceItem),
    [catalogQ.data],
  );

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search services…"
              className="pl-9"
              aria-label="Search services"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {(categoriesQ.data ?? []).map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
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
          >
            <Zap className="h-3.5 w-3.5" aria-hidden />
            Express
          </Button>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Filter className="h-3 w-3" aria-hidden />
          {services.length} service{services.length === 1 ? '' : 's'}
          {browseOnly ? ' · Prices in INR' : ' · Browse before you book'}
        </p>
      </div>

      {catalogQ.isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      )}

      {!catalogQ.isLoading && services.length === 0 && (
        <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          No services match your filters.
        </div>
      )}

      {!catalogQ.isLoading && services.length > 0 && (
        <ul className="grid gap-6 sm:grid-cols-2">
          {services.map((svc) => (
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
      )}
    </div>
  );
}
