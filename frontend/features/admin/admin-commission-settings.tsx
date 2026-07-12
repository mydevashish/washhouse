'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminPanel } from '@/features/admin/components/admin-panel';
import { queryKeys } from '@/lib/query-keys';
import { getDefaultCommission, setDefaultCommission } from '@/services/admin';

export function AdminCommissionSettings() {
  const queryClient = useQueryClient();
  const [rate, setRate] = useState('10');

  const commissionQ = useQuery({
    queryKey: queryKeys.adminCommission(),
    queryFn: getDefaultCommission,
  });

  useEffect(() => {
    if (commissionQ.data?.rate) setRate(commissionQ.data.rate);
  }, [commissionQ.data?.rate]);

  const saveMutation = useMutation({
    mutationFn: (n: number) => setDefaultCommission(n),
    onSuccess: (res) => {
      toast.success('Commission updated');
      setRate(res.rate);
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminCommission() });
    },
    onError: () => toast.error('Update failed'),
  });

  return (
    <AdminPanel
      title="Default commission"
      description="Applied to new laundries without a custom override"
      bodyClassName="px-4 py-4 sm:px-5"
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="commission-rate" className="text-xs">
            Rate (%)
          </Label>
          <Input
            id="commission-rate"
            type="number"
            min={0}
            max={100}
            className="h-9 w-24"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => saveMutation.mutate(Number(rate))}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </AdminPanel>
  );
}
