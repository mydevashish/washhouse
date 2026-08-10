'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Pencil, Plus, Sparkles, X } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { QueryErrorState } from '@/components/feedback/query-error-state';
import { normalizeServiceCategory, serviceCategoryLabel } from '@/features/discover/detail/lib/normalize-service-category';
import { PartnerServiceCategoryField } from '@/features/partner/components/partner-service-category-field';
import { PartnerOpsSurface } from '@/features/partner/components/ops-visual';
import { usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';
import {
  buildPartnerServiceCategoryOptions,
  resolvePartnerServiceCategorySlug,
  type PartnerServiceCategoryOption,
} from '@/features/partner/lib/partner-service-category-options';
import { PartnerHubPillarCard } from '@/features/partner/orders-hub/workspace/partner-hub-pillar-card';
import { PartnerHubWorkspaceModalGate } from '@/features/partner/orders-hub/workspace/partner-hub-workspace-modal';
import { usePartnerHubWorkspaceUrl } from '@/features/partner/orders-hub/workspace/use-partner-hub-workspace-url';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { listServiceCategories } from '@/services/customer-experience';
import type { ServiceCatalogItem } from '@/services/partner-service-catalog';
import {
  createPartnerService,
  deletePartnerService,
  listPartnerServices,
  updatePartnerService,
} from '@/services/partner-service-catalog';

type ServiceEditDraft = {
  name: string;
  category: string;
  price_inr: string;
  description: string;
};

export function usePartnerHubServices() {
  const enabled = usePartnerQueriesEnabled();
  return useQuery({
    queryKey: queryKeys.partnerServiceCatalog(),
    queryFn: listPartnerServices,
    enabled,
    staleTime: STALE.partnerAnalytics,
  });
}

export function usePartnerHubServicesKpis() {
  const q = usePartnerHubServices();
  const rows = q.data ?? [];
  const active = useMemo(() => rows.filter((s) => s.is_active !== false), [rows]);
  const minPrice = useMemo(() => {
    if (active.length === 0) return null;
    return Math.min(...active.map((s) => s.price_inr));
  }, [active]);

  return {
    count: rows.length,
    minPrice,
    isLoading: q.isLoading,
    isError: q.isError,
  };
}

function usePartnerHubServiceCategoryOptions(services: ServiceCatalogItem[] | undefined) {
  const [customCategories, setCustomCategories] = useState<PartnerServiceCategoryOption[]>([]);

  const categoriesQ = useQuery({
    queryKey: ['service-categories'],
    queryFn: listServiceCategories,
    staleTime: 300_000,
  });

  const handleCreateCategory = useCallback((option: PartnerServiceCategoryOption) => {
    setCustomCategories((prev) => {
      const norm = normalizeServiceCategory(option.slug);
      if (prev.some((p) => normalizeServiceCategory(p.slug) === norm)) return prev;
      return [...prev, option];
    });
  }, []);

  const categoryOptions = useMemo(
    () =>
      buildPartnerServiceCategoryOptions(
        categoriesQ.data,
        (services ?? []).map((s) => s.category),
        customCategories,
      ),
    [categoriesQ.data, services, customCategories],
  );

  return { categoriesQ, categoryOptions, handleCreateCategory };
}

function PartnerHubServiceRow({
  service,
  categories,
  onCreateCategory,
  onSaved,
}: {
  service: ServiceCatalogItem;
  categories: PartnerServiceCategoryOption[];
  onCreateCategory: (option: PartnerServiceCategoryOption) => void;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ServiceEditDraft>(() => ({
    name: service.name,
    category: resolvePartnerServiceCategorySlug(service.category, categories),
    price_inr: String(service.price_inr),
    description: service.description ?? '',
  }));
  const [saving, setSaving] = useState(false);

  function startEdit() {
    setDraft({
      name: service.name,
      category: resolvePartnerServiceCategorySlug(service.category, categories),
      price_inr: String(service.price_inr),
      description: service.description ?? '',
    });
    setEditing(true);
  }

  async function saveEdit() {
    const price = Number(draft.price_inr);
    if (!draft.name.trim() || !Number.isFinite(price) || price < 1) {
      toast.error('Name and a valid price are required');
      return;
    }
    setSaving(true);
    try {
      await updatePartnerService(service.id, {
        name: draft.name.trim(),
        category: draft.category,
        price_inr: price,
        description: draft.description.trim() || undefined,
      });
      toast.success('Service updated');
      setEditing(false);
      onSaved();
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Update failed'));
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <tr data-testid={`hub-service-edit-${service.id}`}>
        <td className="px-3 py-3" colSpan={5}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor={`hub-edit-name-${service.id}`}>Name</Label>
              <Input
                id={`hub-edit-name-${service.id}`}
                className="min-h-9"
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <PartnerServiceCategoryField
                id={`hub-edit-cat-${service.id}`}
                value={draft.category}
                onChange={(slug) => setDraft((d) => ({ ...d, category: slug }))}
                options={categories}
                onCreateOption={onCreateCategory}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`hub-edit-price-${service.id}`}>Price (INR)</Label>
              <Input
                id={`hub-edit-price-${service.id}`}
                className="min-h-9"
                type="number"
                min={1}
                value={draft.price_inr}
                onChange={(e) => setDraft((d) => ({ ...d, price_inr: e.target.value }))}
              />
            </div>
            <div className="space-y-1 sm:col-span-4">
              <Label htmlFor={`hub-edit-desc-${service.id}`}>Description</Label>
              <Textarea
                id={`hub-edit-desc-${service.id}`}
                rows={2}
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" className="h-9" disabled={saving} onClick={() => void saveEdit()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : 'Save'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-9"
              disabled={saving}
              onClick={() => setEditing(false)}
            >
              <X className="mr-1 h-3.5 w-3.5" aria-hidden />
              Cancel
            </Button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border/40 last:border-0" data-testid={`hub-service-row-${service.id}`}>
      <td className="px-3 py-2.5">
        <p className="font-medium">{service.name}</p>
        {service.description ? (
          <p className="line-clamp-1 text-xs text-muted-foreground">{service.description}</p>
        ) : null}
      </td>
      <td className="px-3 py-2.5">{serviceCategoryLabel(service.category)}</td>
      <td className="px-3 py-2.5 tabular-nums">₹{service.price_inr}</td>
      <td className="px-3 py-2.5">{service.catalog_status ?? (service.is_active ? 'active' : 'paused')}</td>
      <td className="px-3 py-2.5 text-right">
        <div className="flex flex-wrap justify-end gap-1">
          <Button type="button" size="sm" variant="ghost" className="h-9" onClick={startEdit}>
            <Pencil className="mr-1 h-3.5 w-3.5" aria-hidden />
            Edit
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-9"
            data-testid={`hub-service-toggle-${service.id}`}
            onClick={async () => {
              try {
                await updatePartnerService(service.id, {
                  catalog_status: service.is_active ? 'paused' : 'active',
                  is_active: !service.is_active,
                });
                onSaved();
              } catch (e) {
                toast.error(getApiErrorMessage(e, 'Update failed'));
              }
            }}
          >
            {service.is_active ? 'Pause' : 'Activate'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-9 text-destructive"
            data-testid={`hub-service-delete-${service.id}`}
            onClick={async () => {
              if (!window.confirm(`Remove ${service.name}?`)) return;
              try {
                await deletePartnerService(service.id);
                toast.success('Service removed');
                onSaved();
              } catch (e) {
                toast.error(getApiErrorMessage(e, 'Delete failed'));
              }
            }}
          >
            Delete
          </Button>
        </div>
      </td>
    </tr>
  );
}

export function PartnerHubServicesAddForm({
  categoryOptions,
  categoriesLoading,
  onCreateCategory,
  defaultName,
  onCreated,
}: {
  categoryOptions: PartnerServiceCategoryOption[];
  categoriesLoading: boolean;
  onCreateCategory: (option: PartnerServiceCategoryOption) => void;
  defaultName?: string;
  onCreated: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(defaultName ?? '');
  const [category, setCategory] = useState('wash');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [express, setExpress] = useState(false);

  useEffect(() => {
    if (defaultName) setName(defaultName);
  }, [defaultName]);

  useEffect(() => {
    if (categoryOptions.length === 0) return;
    const resolved = resolvePartnerServiceCategorySlug(category, categoryOptions);
    if (resolved !== category) setCategory(resolved);
  }, [category, categoryOptions]);

  const createM = useMutation({
    mutationFn: () =>
      createPartnerService({
        name: name.trim(),
        category,
        price_inr: Number(price),
        description: description.trim() || undefined,
        estimated_duration_minutes: duration ? Number(duration) : undefined,
        express_available: express,
      }),
    onSuccess: () => {
      toast.success('Service added');
      setName('');
      setPrice('');
      setDescription('');
      setDuration('');
      setExpress(false);
      void queryClient.invalidateQueries({ queryKey: queryKeys.partnerServiceCatalog() });
      onCreated();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not add service')),
  });

  return (
    <div
      className="rounded-xl border border-border/60 bg-muted/20 p-3 sm:p-4"
      data-testid="hub-services-add-form"
    >
      <h3 className="text-sm font-semibold">Add service</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="hub-add-service-name">Service name</Label>
          <Input
            id="hub-add-service-name"
            className="min-h-9"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Men's Shirt Wash + Iron"
          />
        </div>
        <div className="space-y-1">
          <PartnerServiceCategoryField
            id="hub-add-service-category"
            value={category}
            onChange={setCategory}
            options={categoryOptions}
            onCreateOption={onCreateCategory}
            selectDisabled={categoriesLoading && categoryOptions.length <= 1}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="hub-add-service-price">Price (INR)</Label>
          <Input
            id="hub-add-service-price"
            className="min-h-9"
            type="number"
            min={1}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="hub-add-service-duration">Est. duration (min)</Label>
          <Input
            id="hub-add-service-duration"
            className="min-h-9"
            type="number"
            min={5}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={express} onChange={(e) => setExpress(e.target.checked)} />
            Express available
          </label>
        </div>
        <div className="space-y-1 sm:col-span-3">
          <Label htmlFor="hub-add-service-desc">Description</Label>
          <Textarea
            id="hub-add-service-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Premium wash and steam iron for formal shirts."
          />
        </div>
      </div>
      <Button
        className="mt-3 h-9"
        disabled={!name.trim() || !price || createM.isPending}
        data-testid="hub-services-add-submit"
        onClick={() => createM.mutate()}
      >
        {createM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add service'}
      </Button>
    </div>
  );
}

export function PartnerHubServicesWorkspaceToolbar({ onScrollToAdd }: { onScrollToAdd: () => void }) {
  return (
    <Button
      type="button"
      className="h-9 shrink-0 gap-1.5"
      data-testid="hub-services-new"
      onClick={onScrollToAdd}
    >
      <Plus className="h-4 w-4" aria-hidden />
      Add service
    </Button>
  );
}

export function PartnerHubServicesWorkspaceBody({
  servicesQ,
}: {
  servicesQ: ReturnType<typeof usePartnerHubServices>;
}) {
  const queryClient = useQueryClient();
  const [emptyPrefill, setEmptyPrefill] = useState<string | undefined>();

  const { categoryOptions, categoriesQ, handleCreateCategory } = usePartnerHubServiceCategoryOptions(
    servicesQ.data,
  );

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: queryKeys.partnerServiceCatalog() });

  const rows = servicesQ.data ?? [];

  if (servicesQ.isError) {
    return (
      <QueryErrorState
        title="Could not load services"
        message={getApiErrorMessage(servicesQ.error)}
        onRetry={() => void servicesQ.refetch()}
        isRetrying={servicesQ.isFetching}
      />
    );
  }

  return (
    <div className="space-y-4" data-testid="hub-services-body">
      <PartnerHubServicesAddForm
        categoryOptions={categoryOptions}
        categoriesLoading={categoriesQ.isLoading}
        onCreateCategory={handleCreateCategory}
        defaultName={emptyPrefill}
        onCreated={() => setEmptyPrefill(undefined)}
      />

      <PartnerOpsSurface className="overflow-x-auto !p-0">
        <table className="w-full min-w-[36rem] text-sm">
          <thead className="border-b border-border/60 bg-muted/30 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Service</th>
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium">Price</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {servicesQ.isLoading ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-4">
                  <EmptyState
                    icon={Sparkles}
                    title="No services yet"
                    description="Add Wash & Fold or your first offering above — used in walk-in orders and booking."
                    secondaryAction={{
                      label: 'Add Wash & Fold',
                      onClick: () => setEmptyPrefill('Wash & Fold'),
                    }}
                  />
                </td>
              </tr>
            ) : (
              rows.map((s) => (
                <PartnerHubServiceRow
                  key={s.id}
                  service={s}
                  categories={categoryOptions}
                  onCreateCategory={handleCreateCategory}
                  onSaved={invalidate}
                />
              ))
            )}
          </tbody>
        </table>
      </PartnerOpsSurface>
    </div>
  );
}

function PartnerHubServicesPricingFooter() {
  return (
    <div
      className="border-t border-border/60 bg-muted/20 px-4 py-3 sm:px-5"
      data-testid="hub-services-footer"
    >
      <Link
        href="/partner/pricing"
        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        Garment prices
      </Link>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Per-garment rates for detailed pricing — separate from service catalog lines.
      </p>
    </div>
  );
}

export function PartnerHubServicesPillarCard() {
  const { setWorkspace } = usePartnerHubWorkspaceUrl();
  const { count, minPrice, isLoading, isError } = usePartnerHubServicesKpis();

  const secondary =
    isError ? 'Tap to retry' : minPrice != null ? `from ₹${minPrice}` : 'Set up catalog';

  return (
    <PartnerHubPillarCard
      id="services"
      title="Services"
      icon={Sparkles}
      loading={isLoading}
      primaryMetric={isError ? '—' : `${count} services`}
      secondaryMetric={secondary}
      onOpen={() => setWorkspace('services')}
    />
  );
}

export function PartnerHubServicesModalContent() {
  const servicesQ = usePartnerHubServices();

  return (
    <PartnerHubWorkspaceModalGate
      workspaceId="services"
      title="Services"
      description="Add, edit, pause, or remove services — used in walk-in orders and customer booking."
      toolbar={
        <PartnerHubServicesWorkspaceToolbar
          onScrollToAdd={() => {
            document
              .querySelector('[data-testid="hub-services-add-form"]')
              ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        />
      }
      footer={<PartnerHubServicesPricingFooter />}
    >
      <PartnerHubServicesWorkspaceBody servicesQ={servicesQ} />
    </PartnerHubWorkspaceModalGate>
  );
}
