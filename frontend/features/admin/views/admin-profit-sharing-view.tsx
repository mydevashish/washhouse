'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, Clock, IndianRupee, Percent, TrendingUp, Users, Wallet } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InfoBanner } from '@/components/ui/info-banner';
import { AdminContent } from '@/features/admin/components/admin-content';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { AdminPanel } from '@/features/admin/components/admin-panel';
import { KpiCard, KpiGrid } from '@/features/admin/components/kpi-card';
import { formatInrCompact } from '@/features/admin/lib/format-admin';
import { formatInr } from '@/features/discover/detail/order-pricing';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { cn } from '@/lib/utils';
import {
  EXPENSE_CATEGORIES,
  createOwnershipPartner,
  createPlatformExpense,
  deactivateOwnershipPartner,
  deletePlatformExpense,
  finalizeProfitPeriod,
  formatPeriodLabel,
  getProfitSharingOverview,
  listPendingPayouts,
  listPlatformExpenses,
  listPayoutHistory,
  markPayoutPaid,
  previewProfitPeriod,
  updateOwnershipPartner,
} from '@/services/profit-sharing';

type TabId = 'overview' | 'partners' | 'expenses' | 'payouts';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'partners', label: 'Ownership' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'payouts', label: 'Payouts' },
];

export function AdminProfitSharingView() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabId>('overview');
  const now = new Date();
  const [expenseYear, setExpenseYear] = useState(now.getFullYear());
  const [expenseMonth, setExpenseMonth] = useState(now.getMonth() + 1);

  const overviewQ = useQuery({
    queryKey: queryKeys.adminProfitSharingOverview(),
    queryFn: getProfitSharingOverview,
    staleTime: STALE.adminDashboard,
  });

  const expensesQ = useQuery({
    queryKey: queryKeys.adminProfitSharingExpenses(expenseYear, expenseMonth),
    queryFn: () => listPlatformExpenses(expenseYear, expenseMonth),
    staleTime: 30_000,
    enabled: tab === 'expenses',
  });

  const expensePreviewQ = useQuery({
    queryKey: ['admin-profit-sharing-preview', expenseYear, expenseMonth],
    queryFn: () => previewProfitPeriod(expenseYear, expenseMonth),
    staleTime: 30_000,
    enabled: tab === 'expenses',
  });

  const pendingQ = useQuery({
    queryKey: queryKeys.adminProfitSharingPendingPayouts(),
    queryFn: listPendingPayouts,
    staleTime: 30_000,
    enabled: tab === 'payouts',
  });

  const historyQ = useQuery({
    queryKey: queryKeys.adminProfitSharingPayoutHistory(),
    queryFn: () => listPayoutHistory(50),
    staleTime: 30_000,
    enabled: tab === 'payouts',
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.adminProfitSharingOverview() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.adminProfitSharingPendingPayouts() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.adminProfitSharingPayoutHistory() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.adminProfitSharingExpenses(expenseYear, expenseMonth) });
  };

  const finalizeM = useMutation({
    mutationFn: () => finalizeProfitPeriod(overviewQ.data!.current_period.period_year, overviewQ.data!.current_period.period_month),
    onSuccess: () => {
      toast.success('Profit share period finalized');
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Finalize failed')),
  });

  const d = overviewQ.data;
  const cp = d?.current_period;

  return (
    <AdminContent className="space-y-5">
      <AdminPageHeader
        title="Ownership & profit sharing"
        description="Manage platform partner ownership, calculate monthly profit, and track partner payouts."
      />

      <div className="flex flex-wrap gap-0.5 rounded-lg bg-muted/60 p-0.5" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              tab === t.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {overviewQ.isError && (
        <InfoBanner variant="destructive" title="Could not load profit sharing">
          {getApiErrorMessage(overviewQ.error, 'GET /admin/profit-sharing/overview failed')}
        </InfoBanner>
      )}

      {d && !d.ownership_valid && (
        <InfoBanner variant="destructive" title="Ownership must total 100%">
          Active partners currently sum to {d.ownership_total_pct}%. Adjust ownership before finalizing profit share.
        </InfoBanner>
      )}

      {tab === 'overview' && d && cp && (
        <>
          <KpiGrid className="lg:grid-cols-3 xl:grid-cols-6">
            <KpiCard label="Revenue" value={formatInrCompact(Number(cp.revenue_inr))} icon={IndianRupee} loading={overviewQ.isLoading} status="healthy" />
            <KpiCard label="Expenses" value={formatInrCompact(Number(cp.expenses_inr))} icon={Wallet} loading={overviewQ.isLoading} />
            <KpiCard label="Profit" value={formatInrCompact(Number(cp.profit_inr))} icon={TrendingUp} loading={overviewQ.isLoading} status={Number(cp.profit_inr) >= 0 ? 'healthy' : 'warning'} />
            <KpiCard label="Ownership" value={`${d.ownership_total_pct}%`} icon={Percent} loading={overviewQ.isLoading} status={d.ownership_valid ? 'healthy' : 'warning'} />
            <KpiCard label="Pending payouts" value={formatInrCompact(Number(d.pending_payouts_inr))} icon={Clock} loading={overviewQ.isLoading} />
            <KpiCard label="Paid payouts" value={formatInrCompact(Number(d.paid_payouts_inr))} icon={CheckCircle2} loading={overviewQ.isLoading} />
          </KpiGrid>

          <AdminPanel
            title={`Current period — ${formatPeriodLabel(cp.period_year, cp.period_month)}`}
            description="Revenue = platform commission from delivered orders. Profit = Revenue − Expenses."
            toolbar={
              !cp.is_finalized && d.ownership_valid ? (
                <Button
                  size="sm"
                  disabled={finalizeM.isPending}
                  onClick={() => finalizeM.mutate()}
                >
                  Finalize & allocate earnings
                </Button>
              ) : cp.is_finalized ? (
                <span className="text-xs text-muted-foreground">Finalized</span>
              ) : null
            }
          >
            <div className="grid gap-3 p-4 sm:grid-cols-3">
              <MetricBlock label="Revenue" value={formatInr(Number(cp.revenue_inr))} />
              <MetricBlock label="Expenses" value={formatInr(Number(cp.expenses_inr))} />
              <MetricBlock label="Profit" value={formatInr(Number(cp.profit_inr))} highlight />
            </div>
            {d.partners.filter((p) => p.is_active).length > 0 && (
              <div className="border-t border-border/60 px-4 py-3">
                <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Projected partner earnings</p>
                <div className="space-y-1">
                  {d.partners.filter((p) => p.is_active).map((p) => {
                    const earnings = (Number(cp.profit_inr) * Number(p.ownership_pct)) / 100;
                    return (
                      <div key={p.id} className="flex justify-between text-sm">
                        <span>{p.name} ({p.ownership_pct}%)</span>
                        <span className="tabular-nums">{formatInr(earnings)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </AdminPanel>

          {d.recent_payouts.length > 0 && (
            <AllocationTable title="Recent payouts" rows={d.recent_payouts} />
          )}
        </>
      )}

      {tab === 'partners' && <PartnersPanel partners={d?.partners ?? []} loading={overviewQ.isLoading} onChanged={invalidate} />}
      {tab === 'expenses' && (
        <ExpensesPanel
          year={expenseYear}
          month={expenseMonth}
          onYearMonthChange={(y, m) => { setExpenseYear(y); setExpenseMonth(m); }}
          expenses={expensesQ.data ?? []}
          loading={expensesQ.isLoading}
          isFinalized={expensePreviewQ.data?.is_finalized ?? false}
          onChanged={invalidate}
        />
      )}
      {tab === 'payouts' && (
        <div className="space-y-4">
          <AllocationTable
            title="Pending payouts"
            rows={pendingQ.data ?? []}
            loading={pendingQ.isLoading}
            showMarkPaid
            onMarkPaid={async (id, ref) => {
              await markPayoutPaid(id, ref);
              toast.success('Payout marked as paid');
              invalidate();
            }}
          />
          <AllocationTable title="Payout history" rows={historyQ.data ?? []} loading={historyQ.isLoading} />
        </div>
      )}
    </AdminContent>
  );
}

function MetricBlock({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg bg-muted/30 px-3 py-2">
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
      <p className={cn('text-lg font-semibold tabular-nums', highlight && 'text-primary')}>{value}</p>
    </div>
  );
}

function PartnersPanel({
  partners,
  loading,
  onChanged,
}: {
  partners: { id: string; name: string; ownership_pct: string; is_active: boolean; notes: string | null }[];
  loading: boolean;
  onChanged: () => void;
}) {
  const [name, setName] = useState('');
  const [pct, setPct] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !pct) return;
    setSaving(true);
    try {
      await createOwnershipPartner({ name: name.trim(), ownership_pct: Number(pct) });
      toast.success('Partner added');
      setName('');
      setPct('');
      onChanged();
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Could not add partner'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <AdminPanel title="Add ownership partner" description="Total active ownership must equal 100%.">
        <div className="grid gap-3 p-4 sm:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="partner-name">Name</Label>
            <Input id="partner-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Partner name" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="partner-pct">Ownership %</Label>
            <Input id="partner-pct" type="number" min={0.01} max={100} step={0.01} value={pct} onChange={(e) => setPct(e.target.value)} placeholder="33.33" />
          </div>
          <div className="flex items-end">
            <Button className="w-full" disabled={saving || !name.trim() || !pct} onClick={() => void handleCreate()}>
              Add partner
            </Button>
          </div>
        </div>
      </AdminPanel>

      <AdminPanel title="Ownership partners" meta={<Users className="h-4 w-4 text-muted-foreground" aria-hidden />} bodyClassName="p-0">
        {loading && <div className="h-32 animate-pulse bg-muted/30" />}
        {!loading && partners.length === 0 && <p className="px-4 py-6 text-sm text-muted-foreground">No partners yet.</p>}
        {!loading && partners.length > 0 && (
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Ownership</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {partners.map((p) => (
                <PartnerRow key={p.id} partner={p} onChanged={onChanged} />
              ))}
            </tbody>
          </table>
        )}
      </AdminPanel>
    </div>
  );
}

function PartnerRow({
  partner,
  onChanged,
}: {
  partner: { id: string; name: string; ownership_pct: string; is_active: boolean };
  onChanged: () => void;
}) {
  const [pct, setPct] = useState(partner.ownership_pct);
  const [saving, setSaving] = useState(false);

  const savePct = async () => {
    setSaving(true);
    try {
      await updateOwnershipPartner(partner.id, { ownership_pct: Number(pct) });
      toast.success('Ownership updated');
      onChanged();
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Update failed'));
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async () => {
    try {
      await deactivateOwnershipPartner(partner.id);
      toast.success('Partner deactivated');
      onChanged();
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Deactivate failed'));
    }
  };

  return (
    <tr className="hover:bg-muted/20">
      <td className="px-4 py-2.5 font-medium">{partner.name}</td>
      <td className="px-4 py-2.5">
        <Input className="h-8 w-24" type="number" step={0.01} value={pct} onChange={(e) => setPct(e.target.value)} disabled={!partner.is_active} />
      </td>
      <td className="px-4 py-2.5">
        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', partner.is_active ? 'bg-emerald-500/10 text-emerald-700' : 'bg-muted text-muted-foreground')}>
          {partner.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-4 py-2.5 text-right">
        {partner.is_active && (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" disabled={saving || pct === partner.ownership_pct} onClick={() => void savePct()}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => void deactivate()}>
              Deactivate
            </Button>
          </div>
        )}
      </td>
    </tr>
  );
}

function ExpensesPanel({
  year,
  month,
  onYearMonthChange,
  expenses,
  loading,
  isFinalized,
  onChanged,
}: {
  year: number;
  month: number;
  onYearMonthChange: (y: number, m: number) => void;
  expenses: { id: string; category: string; description: string; amount_inr: string }[];
  loading: boolean;
  isFinalized: boolean;
  onChanged: () => void;
}) {
  const [category, setCategory] = useState('operations');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!description.trim() || !amount) return;
    setSaving(true);
    try {
      await createPlatformExpense({
        period_year: year,
        period_month: month,
        category,
        description: description.trim(),
        amount_inr: Number(amount),
      });
      toast.success('Expense recorded');
      setDescription('');
      setAmount('');
      onChanged();
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Could not add expense'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <AdminPanel title="Record expense" description={isFinalized ? 'Period is finalized — no new expenses.' : 'Expenses reduce monthly profit.'}>
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1">
            <Label>Year</Label>
            <Input type="number" value={year} onChange={(e) => onYearMonthChange(Number(e.target.value), month)} />
          </div>
          <div className="space-y-1">
            <Label>Month</Label>
            <Input type="number" min={1} max={12} value={month} onChange={(e) => onYearMonthChange(year, Number(e.target.value))} />
          </div>
          <div className="space-y-1">
            <Label>Category</Label>
            <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1 lg:col-span-2">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Expense description" disabled={isFinalized} />
          </div>
          <div className="space-y-1">
            <Label>Amount (INR)</Label>
            <Input type="number" min={0.01} step={0.01} value={amount} onChange={(e) => setAmount(e.target.value)} disabled={isFinalized} />
          </div>
          <div className="flex items-end lg:col-span-4">
            <Button disabled={saving || isFinalized || !description.trim() || !amount} onClick={() => void handleAdd()}>
              Add expense
            </Button>
          </div>
        </div>
      </AdminPanel>

      <AdminPanel title={`Expenses — ${formatPeriodLabel(year, month)}`} bodyClassName="p-0">
        {loading && <div className="h-32 animate-pulse bg-muted/30" />}
        {!loading && expenses.length === 0 && <p className="px-4 py-6 text-sm text-muted-foreground">No expenses recorded.</p>}
        {!loading && expenses.length > 0 && (
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5">Description</th>
                <th className="px-4 py-2.5 text-right">Amount</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-2.5 capitalize">{e.category}</td>
                  <td className="px-4 py-2.5">{e.description}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatInr(Number(e.amount_inr))}</td>
                  <td className="px-4 py-2.5 text-right">
                    {!isFinalized && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          try {
                            await deletePlatformExpense(e.id);
                            toast.success('Expense deleted');
                            onChanged();
                          } catch (err) {
                            toast.error(getApiErrorMessage(err, 'Delete failed'));
                          }
                        }}
                      >
                        Delete
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AdminPanel>
    </div>
  );
}

function AllocationTable({
  title,
  rows,
  loading,
  showMarkPaid,
  onMarkPaid,
}: {
  title: string;
  rows: { id: string; partner_name: string; period_year: number; period_month: number; ownership_pct: string; earnings_inr: string; payout_status: string; paid_at: string | null; payment_reference: string | null }[];
  loading?: boolean;
  showMarkPaid?: boolean;
  onMarkPaid?: (id: string, ref: string) => Promise<void>;
}) {
  return (
    <AdminPanel title={title} bodyClassName="p-0">
      {loading && <div className="h-32 animate-pulse bg-muted/30" />}
      {!loading && rows.length === 0 && <p className="px-4 py-6 text-sm text-muted-foreground">No records.</p>}
      {!loading && rows.length > 0 && (
        <table className="w-full text-sm">
          <thead className="border-b border-border/60 bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5">Partner</th>
              <th className="px-4 py-2.5">Period</th>
              <th className="px-4 py-2.5">Ownership</th>
              <th className="px-4 py-2.5 text-right">Earnings</th>
              <th className="px-4 py-2.5">Status</th>
              {showMarkPaid && <th className="px-4 py-2.5 text-right">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {rows.map((r) => (
              <AllocationRow key={r.id} row={r} showMarkPaid={showMarkPaid} onMarkPaid={onMarkPaid} />
            ))}
          </tbody>
        </table>
      )}
    </AdminPanel>
  );
}

function AllocationRow({
  row,
  showMarkPaid,
  onMarkPaid,
}: {
  row: { id: string; partner_name: string; period_year: number; period_month: number; ownership_pct: string; earnings_inr: string; payout_status: string; payment_reference: string | null };
  showMarkPaid?: boolean;
  onMarkPaid?: (id: string, ref: string) => Promise<void>;
}) {
  const [ref, setRef] = useState('');
  const [paying, setPaying] = useState(false);

  return (
    <tr>
      <td className="px-4 py-2.5">{row.partner_name}</td>
      <td className="px-4 py-2.5">{formatPeriodLabel(row.period_year, row.period_month)}</td>
      <td className="px-4 py-2.5">{row.ownership_pct}%</td>
      <td className="px-4 py-2.5 text-right tabular-nums">{formatInr(Number(row.earnings_inr))}</td>
      <td className="px-4 py-2.5">
        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', row.payout_status === 'paid' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-amber-500/10 text-amber-700')}>
          {row.payout_status}
          {row.payment_reference ? ` · ${row.payment_reference}` : ''}
        </span>
      </td>
      {showMarkPaid && (
        <td className="px-4 py-2.5">
          {row.payout_status === 'pending' && onMarkPaid && (
            <div className="flex justify-end gap-2">
              <Input className="h-8 w-32" placeholder="Ref / UTR" value={ref} onChange={(e) => setRef(e.target.value)} />
              <Button
                size="sm"
                disabled={paying || !ref.trim()}
                onClick={async () => {
                  setPaying(true);
                  try {
                    await onMarkPaid(row.id, ref.trim());
                    setRef('');
                  } finally {
                    setPaying(false);
                  }
                }}
              >
                Mark paid
              </Button>
            </div>
          )}
        </td>
      )}
    </tr>
  );
}
