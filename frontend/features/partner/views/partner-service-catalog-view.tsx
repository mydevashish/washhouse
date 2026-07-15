'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Package } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { QueryErrorState } from '@/components/feedback/query-error-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { listServiceCategories } from '@/services/customer-experience';
import {
  createPartnerService,
  deletePartnerService,
  listPartnerServices,
  updatePartnerService,
} from '@/services/partner-service-catalog';

export function PartnerServiceCatalogView() {
  const qc = useQueryClient();
  const enabled = usePartnerQueriesEnabled();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('wash');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [express, setExpress] = useState(false);

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
        description="Create detailed service offerings so customers know exactly what you provide."
      />

      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
        <h2 className="text-sm font-semibold">Add service</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1 sm:col-span-2">
            <Label>Service name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Men's Shirt Wash + Iron" />
          </div>
          <div className="space-y-1">
            <Label>Category</Label>
            <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
              {(categoriesQ.data ?? [{ slug: 'wash', name: 'Wash' }]).map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
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
              <tr key={s.id}>
                <td className="px-4 py-2.5">
                  <p className="font-medium">{s.name}</p>
                  {s.description && <p className="text-xs text-muted-foreground line-clamp-1">{s.description}</p>}
                </td>
                <td className="px-4 py-2.5 capitalize">{s.category}</td>
                <td className="px-4 py-2.5 tabular-nums">₹{s.price_inr}</td>
                <td className="px-4 py-2.5">{s.catalog_status ?? (s.is_active ? 'active' : 'paused')}</td>
                <td className="px-4 py-2.5 text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      try {
                        await updatePartnerService(s.id, {
                          catalog_status: s.is_active ? 'paused' : 'active',
                          is_active: !s.is_active,
                        });
                        invalidate();
                      } catch (e) {
                        toast.error(getApiErrorMessage(e, 'Update failed'));
                      }
                    }}
                  >
                    {s.is_active ? 'Pause' : 'Activate'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      try {
                        await deletePartnerService(s.id);
                        toast.success('Service removed');
                        invalidate();
                      } catch (e) {
                        toast.error(getApiErrorMessage(e, 'Delete failed'));
                      }
                    }}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
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
