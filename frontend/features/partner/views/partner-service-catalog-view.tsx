'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Package, Pencil, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { QueryErrorState } from '@/components/feedback/query-error-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { normalizeServiceCategory, serviceCategoryLabel } from '@/features/discover/detail/lib/normalize-service-category';
import { PartnerServiceCategoryField } from '@/features/partner/components/partner-service-category-field';
import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';
import {
  buildPartnerServiceCategoryOptions,
  resolvePartnerServiceCategorySlug,
  type PartnerServiceCategoryOption,
} from '@/features/partner/lib/partner-service-category-options';
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

function PartnerServiceCatalogRow({
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
      <tr>
        <td className="px-4 py-3" colSpan={5}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor={`edit-name-${service.id}`}>Name</Label>
              <Input
                id={`edit-name-${service.id}`}
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <PartnerServiceCategoryField
                id={`edit-cat-${service.id}`}
                value={draft.category}
                onChange={(slug) => setDraft((d) => ({ ...d, category: slug }))}
                options={categories}
                onCreateOption={onCreateCategory}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`edit-price-${service.id}`}>Price (INR)</Label>
              <Input
                id={`edit-price-${service.id}`}
                type="number"
                min={1}
                value={draft.price_inr}
                onChange={(e) => setDraft((d) => ({ ...d, price_inr: e.target.value }))}
              />
            </div>
            <div className="space-y-1 sm:col-span-4">
              <Label htmlFor={`edit-desc-${service.id}`}>Description</Label>
              <Textarea
                id={`edit-desc-${service.id}`}
                rows={2}
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" disabled={saving} onClick={() => void saveEdit()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : 'Save'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
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
    <tr>
      <td className="px-4 py-2.5">
        <p className="font-medium">{service.name}</p>
        {service.description ? (
          <p className="line-clamp-1 text-xs text-muted-foreground">{service.description}</p>
        ) : null}
      </td>
      <td className="px-4 py-2.5">{serviceCategoryLabel(service.category)}</td>
      <td className="px-4 py-2.5 tabular-nums">₹{service.price_inr}</td>
      <td className="px-4 py-2.5">{service.catalog_status ?? (service.is_active ? 'active' : 'paused')}</td>
      <td className="px-4 py-2.5 text-right">
        <Button type="button" size="sm" variant="ghost" onClick={startEdit}>
          <Pencil className="mr-1 h-3.5 w-3.5" aria-hidden />
          Edit
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
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
          onClick={async () => {
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
      </td>
    </tr>
  );
}

export function PartnerServiceCatalogView() {
  const qc = useQueryClient();
  const enabled = usePartnerQueriesEnabled();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('wash');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [express, setExpress] = useState(false);
  const [customCategories, setCustomCategories] = useState<PartnerServiceCategoryOption[]>([]);

  const handleCreateCategory = useCallback((option: PartnerServiceCategoryOption) => {
    setCustomCategories((prev) => {
      const norm = normalizeServiceCategory(option.slug);
      if (prev.some((p) => normalizeServiceCategory(p.slug) === norm)) return prev;
      return [...prev, option];
    });
  }, []);

  const servicesQ = useQuery({
    queryKey: queryKeys.partnerServiceCatalog(),
    queryFn: listPartnerServices,
    enabled,
    staleTime: STALE.partnerAnalytics,
  });

  const categoriesQ = useQuery({
    queryKey: ['service-categories'],
    queryFn: listServiceCategories,
    staleTime: 300_000,
  });

  const categoryOptions = useMemo(
    () =>
      buildPartnerServiceCategoryOptions(
        categoriesQ.data,
        (servicesQ.data ?? []).map((s) => s.category),
        customCategories,
      ),
    [categoriesQ.data, servicesQ.data, customCategories],
  );

  useEffect(() => {
    if (categoryOptions.length === 0) return;
    const resolved = resolvePartnerServiceCategorySlug(category, categoryOptions);
    if (resolved !== category) setCategory(resolved);
  }, [category, categoryOptions]);

  const invalidate = () => void qc.invalidateQueries({ queryKey: queryKeys.partnerServiceCatalog() });

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
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not add service')),
  });

  return (
    <PartnerContent className="space-y-6">
      <PartnerPageHeader
        title="Service catalog"
        description="Add, edit, pause, or remove services — used in walk-in orders and customer booking."
      />

      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
        <h2 className="text-sm font-semibold">Add service</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1 sm:col-span-2">
            <Label>Service name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Men's Shirt Wash + Iron" />
          </div>
          <div className="space-y-1">
            <PartnerServiceCategoryField
              id="partner-add-service-category"
              value={category}
              onChange={setCategory}
              options={categoryOptions}
              onCreateOption={handleCreateCategory}
              selectDisabled={categoriesQ.isLoading && categoryOptions.length <= 1}
            />
          </div>
          <div className="space-y-1">
            <Label>Price (INR)</Label>
            <Input type="number" min={1} value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Est. duration (min)</Label>
            <Input type="number" min={5} value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={express} onChange={(e) => setExpress(e.target.checked)} />
              Express available
            </label>
          </div>
          <div className="space-y-1 sm:col-span-3">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Premium wash and steam iron for formal shirts." />
          </div>
        </div>
        <Button className="mt-3" disabled={!name.trim() || !price || createM.isPending} onClick={() => createM.mutate()}>
          Add service
        </Button>
      </div>

      {servicesQ.isLoading && <Skeleton className="h-48 w-full rounded-2xl" />}

      {servicesQ.isError && (
        <QueryErrorState
          title="Could not load services"
          message={getApiErrorMessage(servicesQ.error)}
          onRetry={() => void servicesQ.refetch()}
          isRetrying={servicesQ.isFetching}
        />
      )}

      {!servicesQ.isLoading && !servicesQ.isError && (
      <div className="overflow-x-auto rounded-2xl border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5">Service</th>
              <th className="px-4 py-2.5">Category</th>
              <th className="px-4 py-2.5">Price</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {(servicesQ.data ?? []).map((s) => (
              <PartnerServiceCatalogRow
                key={s.id}
                service={s}
                categories={categoryOptions}
                onCreateCategory={handleCreateCategory}
                onSaved={invalidate}
              />
            ))}
          </tbody>
        </table>
        {!servicesQ.isLoading && (servicesQ.data?.length ?? 0) === 0 && (
          <EmptyState
            icon={Package}
            title="No services yet"
            description="Add your first offering above so customers know what you provide."
          />
        )}
      </div>
      )}
    </PartnerContent>
  );
}
