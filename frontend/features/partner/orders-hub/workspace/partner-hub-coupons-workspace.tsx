'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Loader2, Plus, Ticket, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PartnerOpsSurface } from '@/features/partner/components/ops-visual';
import { usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';
import { PartnerHubPillarCard } from '@/features/partner/orders-hub/workspace/partner-hub-pillar-card';
import {
  PartnerHubWorkspaceModalGate,
} from '@/features/partner/orders-hub/workspace/partner-hub-workspace-modal';
import { usePartnerHubWorkspaceUrl } from '@/features/partner/orders-hub/workspace/use-partner-hub-workspace-url';
import { queryKeys } from '@/lib/query-keys';
import {
  createPartnerCoupon,
  deletePartnerCoupon,
  listPartnerCoupons,
  updatePartnerCoupon,
  type PartnerCoupon,
} from '@/services/partner-coupons';

export function usePartnerHubCoupons() {
  const enabled = usePartnerQueriesEnabled();
  return useQuery({
    queryKey: queryKeys.partnerCoupons(),
    queryFn: listPartnerCoupons,
    enabled,
  });
}

export function usePartnerHubCouponsKpis() {
  const q = usePartnerHubCoupons();
  const rows = q.data ?? [];
  const active = useMemo(() => rows.filter((r) => r.is_active).length, [rows]);
  return {
    total: rows.length,
    active,
    isLoading: q.isLoading,
    isError: q.isError,
  };
}

export function usePartnerHubCouponsMutations() {
  const queryClient = useQueryClient();

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerCoupons() });

  const createM = useMutation({
    mutationFn: (input: { code: string; discount_percent: number }) => createPartnerCoupon(input),
    onSuccess: () => {
      toast.success('Coupon created');
      invalidate();
    },
    onError: () => toast.error('Could not create coupon'),
  });

  const toggleM = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      updatePartnerCoupon(id, { is_active }),
    onSuccess: invalidate,
    onError: () => toast.error('Could not update coupon'),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deletePartnerCoupon(id),
    onSuccess: () => {
      toast.success('Coupon removed');
      invalidate();
    },
    onError: () => toast.error('Could not delete coupon'),
  });

  return { createM, toggleM, deleteM };
}

export function PartnerHubCouponsCreateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [code, setCode] = useState('');
  const [percent, setPercent] = useState('10');
  const { createM } = usePartnerHubCouponsMutations();

  const reset = () => {
    setCode('');
    setPercent('10');
  };

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent data-testid="hub-coupons-create-dialog">
        <DialogHeader>
          <DialogTitle>Create coupon</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="hub-coupon-code">Code</Label>
            <Input
              id="hub-coupon-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="SUMMER10"
              className="min-h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hub-coupon-percent">Discount %</Label>
            <Input
              id="hub-coupon-percent"
              type="number"
              min={1}
              max={100}
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              className="min-h-9"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            className="h-9"
            disabled={!code.trim() || createM.isPending}
            data-testid="hub-coupons-create-submit"
            onClick={() =>
              createM.mutate(
                { code: code.trim(), discount_percent: Number(percent) },
                {
                  onSuccess: () => handleOpenChange(false),
                },
              )
            }
          >
            {createM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PartnerHubCouponsWorkspaceToolbar({
  onNewCoupon,
}: {
  onNewCoupon: () => void;
}) {
  return (
    <Button
      type="button"
      className="h-9 shrink-0 gap-1.5"
      data-testid="hub-coupons-new"
      onClick={onNewCoupon}
    >
      <Plus className="h-4 w-4" aria-hidden />
      New coupon
    </Button>
  );
}

async function copyCouponCode(code: string) {
  try {
    await navigator.clipboard.writeText(code);
    toast.success('Code copied');
  } catch {
    toast.error('Could not copy code');
  }
}

export function PartnerHubCouponsWorkspaceBody({
  couponsQ,
  mutations,
}: {
  couponsQ: ReturnType<typeof usePartnerHubCoupons>;
  mutations: ReturnType<typeof usePartnerHubCouponsMutations>;
}) {
  const rows = couponsQ.data ?? [];

  if (couponsQ.isError) {
    return (
      <div className="py-8 text-center text-sm" data-testid="hub-coupons-error">
        <p className="text-muted-foreground">Could not load coupons.</p>
        <Button
          type="button"
          variant="outline"
          className="mt-3 h-9"
          onClick={() => void couponsQ.refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <PartnerOpsSurface className="overflow-x-auto !p-0" data-testid="hub-coupons-body">
      <table className="w-full min-w-[28rem] text-sm">
        <thead className="border-b border-border/60 bg-muted/30 text-left text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Code</th>
            <th className="px-3 py-2 font-medium">Discount</th>
            <th className="px-3 py-2 font-medium">Active</th>
            <th className="px-3 py-2 font-medium sr-only">Actions</th>
          </tr>
        </thead>
        <tbody>
          {couponsQ.isLoading ? (
            <tr>
              <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                Loading…
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                No coupons yet — create one for walk-in and doorstep orders.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <PartnerHubCouponRow key={row.id} row={row} mutations={mutations} />
            ))
          )}
        </tbody>
      </table>
    </PartnerOpsSurface>
  );
}

function PartnerHubCouponRow({
  row,
  mutations,
}: {
  row: PartnerCoupon;
  mutations: ReturnType<typeof usePartnerHubCouponsMutations>;
}) {
  const { toggleM, deleteM } = mutations;

  const handleDelete = () => {
    if (!window.confirm(`Remove coupon ${row.code}?`)) return;
    deleteM.mutate(row.id);
  };

  return (
    <tr className="border-b border-border/40 last:border-0" data-testid={`hub-coupon-row-${row.id}`}>
      <td className="px-3 py-2.5 font-medium tabular-nums">{row.code}</td>
      <td className="px-3 py-2.5 tabular-nums">{row.discount_percent}%</td>
      <td className="px-3 py-2.5">
        <Button
          type="button"
          variant={row.is_active ? 'secondary' : 'outline'}
          size="sm"
          className="h-9"
          data-testid={`hub-coupon-toggle-${row.id}`}
          onClick={() => toggleM.mutate({ id: row.id, is_active: !row.is_active })}
        >
          {row.is_active ? 'Active' : 'Off'}
        </Button>
      </td>
      <td className="px-3 py-2.5">
        <div className="flex justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9"
            aria-label={`Copy ${row.code}`}
            data-testid={`hub-coupon-copy-${row.id}`}
            onClick={() => void copyCouponCode(row.code)}
          >
            <Copy className="h-3.5 w-3.5" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 text-destructive"
            aria-label={`Delete ${row.code}`}
            data-testid={`hub-coupon-delete-${row.id}`}
            onClick={handleDelete}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </div>
      </td>
    </tr>
  );
}

export function PartnerHubCouponsPillarCard() {
  const { setWorkspace } = usePartnerHubWorkspaceUrl();
  const { total, active, isLoading, isError } = usePartnerHubCouponsKpis();

  return (
    <PartnerHubPillarCard
      id="coupons"
      title="Coupons"
      icon={Ticket}
      loading={isLoading}
      primaryMetric={isError ? '—' : `${active} active`}
      secondaryMetric={isError ? 'Tap to retry' : `${total} total`}
      onOpen={() => setWorkspace('coupons')}
    />
  );
}

export function PartnerHubCouponsModalContent() {
  const [createOpen, setCreateOpen] = useState(false);
  const couponsQ = usePartnerHubCoupons();
  const mutations = usePartnerHubCouponsMutations();

  return (
    <>
      <PartnerHubWorkspaceModalGate
        workspaceId="coupons"
        title="Coupons"
        description="Discount codes for your shop — apply them when creating orders in the Create tab."
        toolbar={
          <PartnerHubCouponsWorkspaceToolbar onNewCoupon={() => setCreateOpen(true)} />
        }
      >
        <PartnerHubCouponsWorkspaceBody couponsQ={couponsQ} mutations={mutations} />
      </PartnerHubWorkspaceModalGate>
      <PartnerHubCouponsCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
