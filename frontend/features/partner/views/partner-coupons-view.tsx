'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { PartnerOpsSurface } from '@/features/partner/components/ops-visual';
import { queryKeys } from '@/lib/query-keys';
import {
  createPartnerCoupon,
  deletePartnerCoupon,
  listPartnerCoupons,
  updatePartnerCoupon,
} from '@/services/partner-coupons';

export function PartnerCouponsView() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [percent, setPercent] = useState('10');

  const couponsQ = useQuery({
    queryKey: queryKeys.partnerCoupons(),
    queryFn: listPartnerCoupons,
  });

  const createM = useMutation({
    mutationFn: () =>
      createPartnerCoupon({
        code: code.trim(),
        discount_percent: Number(percent),
      }),
    onSuccess: () => {
      toast.success('Coupon created');
      void queryClient.invalidateQueries({ queryKey: queryKeys.partnerCoupons() });
      setOpen(false);
      setCode('');
      setPercent('10');
    },
    onError: () => toast.error('Could not create coupon'),
  });

  const toggleM = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      updatePartnerCoupon(id, { is_active }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.partnerCoupons() });
    },
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deletePartnerCoupon(id),
    onSuccess: () => {
      toast.success('Coupon removed');
      void queryClient.invalidateQueries({ queryKey: queryKeys.partnerCoupons() });
    },
    onError: () => toast.error('Could not delete coupon'),
  });

  const rows = couponsQ.data ?? [];

  return (
    <PartnerContent className="space-y-4">
      <PartnerPageHeader
        title="Coupons"
        description="Discount codes for your shop — apply them when creating orders in Customers & Orders."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button type="button" size="sm" className="h-9 gap-1.5">
                <Plus className="h-3.5 w-3.5" aria-hidden />
                New coupon
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create coupon</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="coupon-code">Code</Label>
                  <Input
                    id="coupon-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="SUMMER10"
                    className="min-h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="coupon-percent">Discount %</Label>
                  <Input
                    id="coupon-percent"
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
                  disabled={!code.trim() || createM.isPending}
                  onClick={() => createM.mutate()}
                >
                  {createM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <PartnerOpsSurface className="overflow-hidden !p-0">
        <table className="w-full text-sm">
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
                <tr key={row.id} className="border-b border-border/40 last:border-0">
                  <td className="px-3 py-2.5 font-medium tabular-nums">{row.code}</td>
                  <td className="px-3 py-2.5 tabular-nums">{row.discount_percent}%</td>
                  <td className="px-3 py-2.5">
                    <Button
                      type="button"
                      variant={row.is_active ? 'secondary' : 'outline'}
                      size="sm"
                      className="h-8"
                      onClick={() =>
                        toggleM.mutate({ id: row.id, is_active: !row.is_active })
                      }
                    >
                      {row.is_active ? 'Active' : 'Off'}
                    </Button>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-destructive"
                      onClick={() => deleteM.mutate(row.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </PartnerOpsSurface>
    </PartnerContent>
  );
}
