'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';

import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { Button } from '@/components/ui/button';
import { ClientDate } from '@/components/ui/client-date';
import { QueryErrorState } from '@/components/feedback/query-error-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  OWNER_IMAGES,
  OwnerEmptyState,
  OwnerSectionHeader,
} from '@/features/partner/components/owner';
import { OwnerStaffCard } from '@/features/partner/components/owner/owner-staff-card';
import { OwnerStaffCoverage } from '@/features/partner/components/owner/owner-staff-coverage';
import {
  OwnerStaffFormDialog,
  type StaffFormValues,
} from '@/features/partner/components/owner/owner-staff-form-dialog';
import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { PartnerPanel } from '@/features/partner/components/partner-panel';
import { usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';
import {
  filterStaffByCapability,
  parseStaffCapability,
  type StaffCapability,
} from '@/features/partner/lib/owner-staff';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { useServerList } from '@/lib/pagination/use-server-list';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { cn } from '@/lib/utils';
import {
  ACTIVITY_LABELS,
  activateStaffMember,
  createStaffMember,
  deactivateStaffMember,
  getStaffActivity,
  listStaffMembers,
  resetStaffPassword,
  suspendStaffMember,
  unsuspendStaffMember,
  updateStaffMember,
  type StaffActivityRow,
  type StaffMember,
} from '@/services/staff-management';

function PartnerStaffViewBody() {
  const queryClient = useQueryClient();
  const enabled = usePartnerQueriesEnabled();
  const searchParams = useSearchParams();
  const router = useRouter();

  const capabilityFilter = parseStaffCapability(searchParams.get('capability'));
  const wantAdd = searchParams.get('action') === 'add';

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [activityStaffId, setActivityStaffId] = useState<string | null>(null);
  const [preferCapability, setPreferCapability] = useState<StaffCapability | null>(capabilityFilter);

  const staffQ = useQuery({
    queryKey: queryKeys.partnerStaffMembers(),
    queryFn: listStaffMembers,
    enabled,
    staleTime: STALE.adminDashboard,
  });

  const activityList = useServerList<StaffActivityRow, { staff_id?: string }>({
    queryKey: queryKeys.partnerStaffActivity(activityStaffId ?? undefined),
    fetcher: (params) =>
      getStaffActivity({
        staff_id: params.staff_id,
        page: params.page,
        page_size: params.page_size,
      }),
    filters: activityStaffId ? { staff_id: activityStaffId } : {},
    defaultPageSize: 10,
    enabled,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerStaffMembers() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerStaffDashboard() });
    void queryClient.invalidateQueries({ queryKey: ['partner-staff-activity'] });
  };

  useEffect(() => {
    if (wantAdd) {
      setFormMode('create');
      setEditing(null);
      setPreferCapability(capabilityFilter);
      setFormOpen(true);
    }
  }, [wantAdd, capabilityFilter]);

  const clearActionParam = () => {
    if (!wantAdd && !capabilityFilter) return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete('action');
    const qs = next.toString();
    router.replace(qs ? `/partner/staff?${qs}` : '/partner/staff', { scroll: false });
  };

  const createM = useMutation({
    mutationFn: (values: StaffFormValues) =>
      createStaffMember({
        name: values.name,
        email: values.email,
        phone: values.phone || undefined,
        role: values.role,
        work_schedule: values.work_schedule,
      }),
    onSuccess: (r) => {
      toast.success(r.temporary_password ? `Staff created. Temp password: ${r.temporary_password}` : 'Staff created');
      setFormOpen(false);
      clearActionParam();
      invalidate();
    },
    onError: () => toast.error('Could not create staff'),
  });

  const updateM = useMutation({
    mutationFn: (values: StaffFormValues) => {
      if (!editing) throw new Error('No staff selected');
      return updateStaffMember(editing.id, {
        name: values.name,
        phone: values.phone || undefined,
        role: values.role,
        work_schedule: values.work_schedule,
      });
    },
    onSuccess: () => {
      toast.success('Staff updated');
      setFormOpen(false);
      setEditing(null);
      invalidate();
    },
    onError: () => toast.error('Could not update staff'),
  });

  const deactivateM = useMutation({
    mutationFn: deactivateStaffMember,
    onSuccess: () => {
      toast.success('Staff deactivated');
      invalidate();
    },
    onError: () => toast.error('Could not deactivate staff'),
  });

  const activateM = useMutation({
    mutationFn: activateStaffMember,
    onSuccess: () => {
      toast.success('Staff activated');
      invalidate();
    },
    onError: () => toast.error('Could not activate staff'),
  });

  const resetM = useMutation({
    mutationFn: resetStaffPassword,
    onSuccess: (r) => {
      toast.success(`New password: ${r.temporary_password}`);
      invalidate();
    },
    onError: () => toast.error('Could not reset password'),
  });

  const suspendM = useMutation({
    mutationFn: (id: string) => suspendStaffMember(id, 'Suspended by manager'),
    onSuccess: () => {
      toast.success('Staff suspended');
      invalidate();
    },
    onError: () => toast.error('Could not suspend staff'),
  });

  const unsuspendM = useMutation({
    mutationFn: unsuspendStaffMember,
    onSuccess: () => {
      toast.success('Staff unsuspended');
      invalidate();
    },
    onError: () => toast.error('Could not unsuspend staff'),
  });

  const staff = staffQ.data ?? [];
  const filtered = useMemo(
    () => filterStaffByCapability(staff, capabilityFilter),
    [staff, capabilityFilter],
  );
  const busy =
    createM.isPending ||
    updateM.isPending ||
    deactivateM.isPending ||
    activateM.isPending ||
    resetM.isPending ||
    suspendM.isPending ||
    unsuspendM.isPending;

  const openCreate = (cap?: StaffCapability | null) => {
    setFormMode('create');
    setEditing(null);
    setPreferCapability(cap ?? capabilityFilter);
    setFormOpen(true);
  };

  const openEdit = (member: StaffMember) => {
    setFormMode('edit');
    setEditing(member);
    setPreferCapability(null);
    setFormOpen(true);
  };

  return (
    <PartnerContent className="space-y-5">
      <div data-testid="partner-staff-view" className="space-y-5">
      <PartnerPageHeader
        title="Staff"
        description="Roster, today’s pickup/delivery coverage, and calm add/edit — assign still happens on Logistics runs."
        actions={
          <Button type="button" className="min-h-[44px] gap-1.5" onClick={() => openCreate()}>
            <UserPlus className="h-3.5 w-3.5" aria-hidden />
            Add helper
          </Button>
        }
      />

      {staffQ.isError ? (
        <QueryErrorState
          title="Could not load staff"
          message={getApiErrorMessage(staffQ.error)}
          onRetry={() => void staffQ.refetch()}
          isRetrying={staffQ.isFetching}
        />
      ) : null}

      {staffQ.isLoading ? <Skeleton className="h-36 w-full rounded-2xl" /> : null}

      {!staffQ.isLoading && staff.length > 0 ? <OwnerStaffCoverage members={staff} /> : null}

      {capabilityFilter ? (
        <div
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-info-muted/40 px-3 py-2 text-sm text-info ring-1 ring-info/30"
          role="status"
        >
          <span>
            Showing staff who can run <strong className="font-semibold">{capabilityFilter}</strong> (from Logistics).
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-[40px]"
            onClick={() => router.replace('/partner/staff', { scroll: false })}
          >
            Clear filter
          </Button>
        </div>
      ) : null}

      <OwnerSectionHeader
        title="Team roster"
        description={
          filtered.length === staff.length
            ? `${staff.length} people`
            : `${filtered.length} of ${staff.length} matching filter`
        }
        action={
          <Button type="button" variant="outline" size="sm" className="min-h-[44px]" onClick={() => openCreate()}>
            Add
          </Button>
        }
      />

      {staffQ.isLoading ? <Skeleton className="h-64 w-full rounded-2xl" /> : null}

      {!staffQ.isLoading && staff.length === 0 ? (
        <OwnerEmptyState
          title="No helpers yet"
          description="Add your first pickup or delivery helper so Logistics can assign runs."
          imageSrc={OWNER_IMAGES.emptyStaff}
          imageAlt="Quiet shop ready for a team"
          action={{ label: 'Add your first helper', href: '/partner/staff?action=add' }}
        />
      ) : null}

      {!staffQ.isLoading && staff.length > 0 && filtered.length === 0 ? (
        <OwnerEmptyState
          title="No matching staff"
          description="Nobody with this capability yet — add a helper or clear the filter."
          imageSrc={OWNER_IMAGES.people}
          imageAlt="Team"
          action={{
            label: `Add ${capabilityFilter ?? 'staff'}`,
            href: `/partner/staff?action=add${capabilityFilter ? `&capability=${capabilityFilter}` : ''}`,
          }}
        />
      ) : null}

      {filtered.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" data-testid="owner-staff-grid">
          {filtered.map((member) => (
            <OwnerStaffCard
              key={member.id}
              member={member}
              busy={busy}
              onEdit={() => openEdit(member)}
              onActivity={() =>
                setActivityStaffId((prev) => (prev === member.id ? null : member.id))
              }
              onResetPassword={() => resetM.mutate(member.id)}
              onSuspend={() => suspendM.mutate(member.id)}
              onUnsuspend={() => unsuspendM.mutate(member.id)}
              onDeactivate={() => deactivateM.mutate(member.id)}
              onActivate={() => activateM.mutate(member.id)}
            />
          ))}
        </div>
      ) : null}

      <PartnerPanel
        title={activityStaffId ? 'Activity for selected staff' : 'Recent activity'}
        meta={activityStaffId ? 'Filtered' : 'Team'}
        bodyClassName="p-0"
        toolbar={
          activityStaffId ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => setActivityStaffId(null)}>
              Show all
            </Button>
          ) : undefined
        }
      >
        {activityList.isError ? (
          <div className="p-4">
            <QueryErrorState
              title="Could not load activity"
              message={getApiErrorMessage(activityList.error)}
              onRetry={() => void activityList.refetch()}
              isRetrying={activityList.isFetching}
            />
          </div>
        ) : null}
        {activityList.isLoading ? <Skeleton className="m-4 h-32 w-full" /> : null}
        {!activityList.isLoading && activityList.rows.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">No activity recorded yet.</p>
        ) : null}
        <div className="divide-y divide-border/50">
          {activityList.rows.map((row) => (
            <div
              key={row.id}
              className={cn(
                'flex flex-col gap-0.5 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between',
                activityStaffId && row.staff_id === activityStaffId && 'bg-muted/30',
              )}
            >
              <div>
                <p className="text-sm font-medium">{row.staff_name}</p>
                <p className="text-xs text-muted-foreground">
                  {row.description ?? ACTIVITY_LABELS[row.action] ?? row.action}
                </p>
              </div>
              <ClientDate iso={row.created_at} mode="datetime" className="text-[10px] text-muted-foreground" />
            </div>
          ))}
        </div>
        {activityList.totalRecords > 0 ? (
          <div className="border-t border-border/50 px-2 py-2">
            <DataTablePagination
              page={activityList.page}
              pageCount={activityList.pageCount}
              pageSize={activityList.pageSize}
              pageStart={activityList.pageStart}
              pageEnd={activityList.pageEnd}
              totalCount={activityList.totalRecords}
              onPageChange={activityList.setPage}
              onPageSizeChange={activityList.setPageSize}
            />
          </div>
        ) : null}
      </PartnerPanel>

      <OwnerStaffFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditing(null);
            clearActionParam();
          }
        }}
        mode={formMode}
        initial={editing}
        preferCapability={preferCapability}
        pending={createM.isPending || updateM.isPending}
        onSubmit={(values) => {
          if (formMode === 'create') createM.mutate(values);
          else updateM.mutate(values);
        }}
      />
      </div>
    </PartnerContent>
  );
}

export function PartnerStaffView() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
      <PartnerStaffViewBody />
    </Suspense>
  );
}
