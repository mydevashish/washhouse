'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, Loader2, Shield } from 'lucide-react';

import { ServerListToolbar } from '@/components/data-table/server-list-toolbar';
import { VirtualDataTable, type VirtualColumnDef } from '@/components/data-table/virtual-data-table';
import { Button } from '@/components/ui/button';
import { ClientDate } from '@/components/ui/client-date';
import { EmptyState } from '@/components/ui/empty-state';
import { InfoBanner } from '@/components/ui/info-banner';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminFilterBar, AdminFilterField, AdminPanel } from '@/features/admin/components/admin-panel';
import { TrustScoreBadge } from '@/features/admin/components/trust-score-badge';
import { formatOrderTimestamp } from '@/features/orders/lib/order-status-meta';
import { useServerList } from '@/lib/pagination/use-server-list';
import { queryKeys } from '@/lib/query-keys';
import {
  getAdminTrustScoreDetail,
  listAdminTrustScores,
  type CustomerTrustScoreSummary,
  type TrustScoreListFilters,
} from '@/services/trust-score';

function TrustScoreDetailPanel({ userId, onBack }: { userId: string; onBack: () => void }) {
  const detailQ = useQuery({
    queryKey: queryKeys.adminTrustScore(userId),
    queryFn: () => getAdminTrustScoreDetail(userId),
  });

  if (detailQ.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (detailQ.error || !detailQ.data) {
    return (
      <InfoBanner variant="destructive" title="Could not load trust score">
        <button type="button" className="underline" onClick={onBack}>
          Back
        </button>
      </InfoBanner>
    );
  }

  const d = detailQ.data;

  return (
    <div className="space-y-5">
      <button type="button" onClick={onBack} className="text-sm font-semibold text-primary hover:underline">
        ← All customers
      </button>

      <article className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold">{d.full_name}</h3>
            <p className="text-sm text-muted-foreground">{d.email ?? 'No email'}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Customer since <ClientDate iso={d.created_at} mode="date" />
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold tabular-nums">{d.trust_score}</p>
            <TrustScoreBadge level={d.level} className="mt-1" />
          </div>
        </div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-muted-foreground">Delivered orders</dt>
            <dd className="font-semibold tabular-nums">{d.delivered_orders}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Disputes</dt>
            <dd className="font-semibold tabular-nums">{d.dispute_count}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Refunds</dt>
            <dd className="font-semibold tabular-nums">{d.refund_count}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Risk level</dt>
            <dd className="font-semibold capitalize">{d.risk_level ?? '—'}</dd>
          </div>
        </dl>
      </article>

      <AdminPanel title="Score history" bodyClassName="p-0">
        {d.events.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No score adjustments yet — baseline 100.</p>
        ) : (
          <ul className="divide-y divide-border">
            {d.events.map((e) => (
              <li key={e.id} className="flex flex-wrap items-start justify-between gap-2 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium">{e.label}</p>
                  <time dateTime={e.created_at} className="text-xs text-muted-foreground">
                    {formatOrderTimestamp(e.created_at)}
                  </time>
                </div>
                <div className="text-right">
                  <p className={`font-bold tabular-nums ${e.delta > 0 ? 'text-success' : 'text-destructive'}`}>
                    {e.delta > 0 ? '+' : ''}
                    {e.delta}
                  </p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {e.score_before} → {e.score_after}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>
    </div>
  );
}

export function AdminTrustScoresPanel() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<TrustScoreListFilters>({});

  const list = useServerList<CustomerTrustScoreSummary, TrustScoreListFilters>({
    queryKey: queryKeys.adminTrustScores(),
    fetcher: listAdminTrustScores,
    filters,
    defaultSort: { sort_by: 'trust_score', sort_order: 'asc' },
  });

  const columns = useMemo<VirtualColumnDef<CustomerTrustScoreSummary>[]>(
    () => [
      {
        id: 'full_name',
        header: 'User',
        sortable: true,
        cell: (r) => (
          <div>
            <p className="font-medium">{r.full_name}</p>
            <p className="text-xs text-muted-foreground">{r.email ?? r.phone ?? '—'}</p>
          </div>
        ),
      },
      { id: 'role', header: 'Role', sortable: false, cell: (r) => <span className="capitalize">{r.role}</span> },
      {
        id: 'trust_score',
        header: 'Trust Score',
        sortable: true,
        cell: (r) => <TrustScoreBadge level={r.level} score={r.trust_score} />,
      },
      {
        id: 'risk_level',
        header: 'Risk Level',
        cell: (r) => <span className="capitalize text-sm">{r.risk_level ?? '—'}</span>,
      },
      { id: 'disputes', header: 'Disputes', sortable: true, cell: (r) => r.dispute_count },
      { id: 'refunds', header: 'Refunds', cell: (r) => r.refund_count },
      { id: 'orders', header: 'Orders', sortable: true, cell: (r) => r.delivered_orders },
      {
        id: 'status',
        header: 'Status',
        cell: (r) => <span className="capitalize text-sm">{r.status}</span>,
      },
      {
        id: 'created_at',
        header: 'Created',
        sortable: true,
        cell: (r) => <ClientDate iso={r.created_at} mode="date" />,
      },
      {
        id: 'actions',
        header: '',
        cell: (r) => (
          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setSelectedId(r.user_id)}>
            <Eye className="h-4 w-4" aria-hidden />
            <span className="sr-only">View details</span>
          </Button>
        ),
      },
    ],
    [],
  );

  if (selectedId) {
    return <TrustScoreDetailPanel userId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  if (list.isLoading && list.rows.length === 0) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  if (list.isError) {
    return (
      <InfoBanner variant="destructive" title="Could not load trust scores">
        Try refreshing the page.
      </InfoBanner>
    );
  }

  return (
    <AdminPanel
      title="Customer trust scores"
      bodyClassName="p-0 space-y-0"
      toolbar={
        <ServerListToolbar
          search={list.search}
          onSearchChange={list.setSearch}
          searchPlaceholder="Name, email, phone, user ID…"
          totalRecords={list.totalRecords}
          isLoading={list.isFetching}
          onRefresh={() => void list.refetch()}
        />
      }
    >
      <AdminFilterBar className="border-b border-border px-4 py-3">
        <AdminFilterField label="Role">
          <Select
            value={filters.role ?? 'customer'}
            onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value || undefined }))}
            className="h-9 w-full min-w-[8rem]"
            aria-label="Role filter"
          >
            <option value="customer">Customer</option>
            <option value="partner">Partner</option>
          </Select>
        </AdminFilterField>
        <AdminFilterField label="Risk level">
          <Select
            value={filters.risk_level ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, risk_level: e.target.value || undefined }))}
            className="h-9 w-full min-w-[8rem]"
            aria-label="Risk level filter"
          >
            <option value="">All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </Select>
        </AdminFilterField>
        <AdminFilterField label="Min score">
          <Input
            type="number"
            min={0}
            max={100}
            value={filters.trust_score_min ?? ''}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                trust_score_min: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
            className="h-9 w-24"
          />
        </AdminFilterField>
        <AdminFilterField label="Max score">
          <Input
            type="number"
            min={0}
            max={100}
            value={filters.trust_score_max ?? ''}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                trust_score_max: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
            className="h-9 w-24"
          />
        </AdminFilterField>
        <AdminFilterField label="Status">
          <Select
            value={filters.status ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))}
            className="h-9 w-full min-w-[8rem]"
            aria-label="Status filter"
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="high_risk">High risk</option>
          </Select>
        </AdminFilterField>
        <AdminFilterField label="From">
          <Input
            type="date"
            value={filters.created_from?.slice(0, 10) ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, created_from: e.target.value || undefined }))}
            className="h-9"
          />
        </AdminFilterField>
        <AdminFilterField label="To">
          <Input
            type="date"
            value={filters.created_to?.slice(0, 10) ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, created_to: e.target.value || undefined }))}
            className="h-9"
          />
        </AdminFilterField>
      </AdminFilterBar>

      <VirtualDataTable
        tableId="admin-trust-scores"
        columns={columns}
        rows={list.rows}
        getRowId={(r) => r.user_id}
        sort={list.sort}
        onToggleSort={list.toggleSort}
        page={list.page}
        pageCount={list.pageCount}
        pageSize={list.pageSize}
        pageStart={list.pageStart}
        pageEnd={list.pageEnd}
        filteredCount={list.totalRecords}
        onPageChange={list.setPage}
        onPageSizeChange={list.setPageSize}
        emptyState={
          <div className="p-8">
            <EmptyState
              icon={Shield}
              title={list.search ? 'No matches' : 'No customers'}
              description={
                list.search
                  ? 'Try a different search or filter.'
                  : 'Trust scores appear for registered customers.'
              }
            />
          </div>
        }
      />
    </AdminPanel>
  );
}
