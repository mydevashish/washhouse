'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminPanel } from '@/features/admin/components/admin-panel';
import { listLaundriesManagement } from '@/services/admin';
import {
  removePartnerCommission,
  setPartnerCommission,
  updateDefaultCommission,
  updateLaundryCommission,
  type PlatformConfig,
} from '@/services/platform-config';

type Props = {
  config: PlatformConfig | undefined;
  onSaved: () => void;
};

export function PlatformConfigCommissionSection({ config, onSaved }: Props) {
  const [defaultRate, setDefaultRate] = useState('10');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerRate, setPartnerRate] = useState('10');
  const [laundrySearch, setLaundrySearch] = useState('');
  const [selectedLaundryId, setSelectedLaundryId] = useState('');
  const [newLaundryRate, setNewLaundryRate] = useState('10');
  const [editingLaundryId, setEditingLaundryId] = useState<string | null>(null);
  const [editLaundryRate, setEditLaundryRate] = useState('');

  const laundriesQ = useQuery({
    queryKey: ['admin-laundries-management'],
    queryFn: listLaundriesManagement,
    staleTime: 60_000,
  });

  const filteredLaundries = useMemo(() => {
    const q = laundrySearch.trim().toLowerCase();
    const rows = laundriesQ.data ?? [];
    if (!q) return rows.slice(0, 8);
    return rows
      .filter((l) => l.name.toLowerCase().includes(q) || l.city.toLowerCase().includes(q))
      .slice(0, 8);
  }, [laundrySearch, laundriesQ.data]);

  const saveDefaultM = useMutation({
    mutationFn: () => updateDefaultCommission(Number(defaultRate)),
    onSuccess: () => {
      toast.success('Default commission saved');
      onSaved();
    },
    onError: () => toast.error('Could not save default commission'),
  });

  const saveLaundryM = useMutation({
    mutationFn: ({ id, rate }: { id: string; rate: number | null }) => updateLaundryCommission(id, rate),
    onSuccess: () => {
      toast.success('Laundry commission saved');
      setEditingLaundryId(null);
      setSelectedLaundryId('');
      setLaundrySearch('');
      onSaved();
    },
    onError: () => toast.error('Could not save laundry commission'),
  });

  const partnerM = useMutation({
    mutationFn: () => setPartnerCommission({ email: partnerEmail.trim(), rate: Number(partnerRate) }),
    onSuccess: () => {
      toast.success('Partner commission saved');
      setPartnerEmail('');
      onSaved();
    },
    onError: () => toast.error('Could not save partner commission'),
  });

  const removePartnerM = useMutation({
    mutationFn: removePartnerCommission,
    onSuccess: () => {
      toast.success('Partner override removed');
      onSaved();
    },
    onError: () => toast.error('Could not remove partner override'),
  });

  useEffect(() => {
    if (config) setDefaultRate(config.commission.default_rate);
  }, [config]);

  return (
    <AdminPanel
      title="Commission settings"
      description="Default → laundry → partner override priority on new orders"
      bodyClassName="space-y-5 px-4 py-4"
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="default-commission">Default commission (%)</Label>
          <Input
            id="default-commission"
            type="number"
            min={0}
            max={100}
            step={0.1}
            className="h-9 w-28"
            value={defaultRate}
            onChange={(e) => setDefaultRate(e.target.value)}
          />
        </div>
        <Button size="sm" disabled={saveDefaultM.isPending} onClick={() => saveDefaultM.mutate()}>
          Save default
        </Button>
        {config && (
          <p className="text-xs text-muted-foreground">
            Current platform default: {config.commission.default_rate}%
          </p>
        )}
      </div>

      <div className="border-t border-border/50 pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Laundry-specific commission
        </p>
        {config && config.commission.laundry_overrides.length > 0 ? (
          <div className="space-y-2">
            {config.commission.laundry_overrides.map((l) => (
              <div
                key={l.laundry_id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/30 px-3 py-2 ring-1 ring-border/40"
              >
                <div className="min-w-0 text-sm">
                  <p className="font-medium">{l.laundry_name}</p>
                  <p className="text-xs text-muted-foreground">{l.city}</p>
                </div>
                {editingLaundryId === l.laundry_id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      className="h-8 w-20"
                      value={editLaundryRate}
                      onChange={(e) => setEditLaundryRate(e.target.value)}
                      aria-label="Laundry commission percent"
                    />
                    <Button
                      size="sm"
                      disabled={saveLaundryM.isPending}
                      onClick={() =>
                        saveLaundryM.mutate({
                          id: l.laundry_id,
                          rate: editLaundryRate.trim() === '' ? null : Number(editLaundryRate),
                        })
                      }
                    >
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingLaundryId(null)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold tabular-nums">{l.commission_rate}%</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingLaundryId(l.laundry_id);
                        setEditLaundryRate(l.commission_rate);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      disabled={saveLaundryM.isPending}
                      onClick={() => saveLaundryM.mutate({ id: l.laundry_id, rate: null })}
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No laundry overrides — all laundries use the default rate.</p>
        )}

        <div className="mt-4 space-y-2 rounded-lg border border-dashed border-border/60 p-3">
          <p className="text-xs font-semibold">Add laundry override</p>
          <Input
            placeholder="Search laundry by name or city…"
            className="h-9"
            value={laundrySearch}
            onChange={(e) => setLaundrySearch(e.target.value)}
          />
          {filteredLaundries.length > 0 && (
            <div className="max-h-32 space-y-1 overflow-y-auto">
              {filteredLaundries.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted/50 ${
                    selectedLaundryId === l.id ? 'bg-primary/10 ring-1 ring-primary/30' : ''
                  }`}
                  onClick={() => {
                    setSelectedLaundryId(l.id);
                    setLaundrySearch(`${l.name} · ${l.city}`);
                    setNewLaundryRate(l.custom_commission_rate ?? config?.commission.default_rate ?? '10');
                  }}
                >
                  <span>{l.name} · {l.city}</span>
                  <span className="text-muted-foreground">{l.effective_commission_rate}% eff.</span>
                </button>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-end gap-2">
            <div className="grid gap-1">
              <Label className="text-[10px]">Rate (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.1}
                className="h-8 w-20"
                value={newLaundryRate}
                onChange={(e) => setNewLaundryRate(e.target.value)}
              />
            </div>
            <Button
              size="sm"
              disabled={!selectedLaundryId || saveLaundryM.isPending}
              onClick={() =>
                saveLaundryM.mutate({ id: selectedLaundryId, rate: Number(newLaundryRate) })
              }
            >
              Set override
            </Button>
          </div>
        </div>
      </div>

      <div className="border-t border-border/50 pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Partner-specific commission
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <Input
            placeholder="Partner email"
            className="h-9 min-w-[180px] flex-1"
            value={partnerEmail}
            onChange={(e) => setPartnerEmail(e.target.value)}
          />
          <Input
            type="number"
            min={0}
            max={100}
            step={0.1}
            className="h-9 w-24"
            value={partnerRate}
            onChange={(e) => setPartnerRate(e.target.value)}
            aria-label="Partner commission percent"
          />
          <Button size="sm" disabled={!partnerEmail.trim() || partnerM.isPending} onClick={() => partnerM.mutate()}>
            Add override
          </Button>
        </div>
        {config && config.commission.partner_overrides.length > 0 && (
          <div className="mt-3 space-y-2">
            {config.commission.partner_overrides.map((p) => (
              <div
                key={p.user_id}
                className="flex items-center justify-between gap-2 rounded-lg bg-muted/30 px-3 py-2 text-sm ring-1 ring-border/40"
              >
                <span>
                  {p.full_name} · {p.email} — <strong>{p.commission_rate}%</strong>
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-destructive"
                  disabled={removePartnerM.isPending}
                  onClick={() => removePartnerM.mutate(p.user_id)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminPanel>
  );
}
