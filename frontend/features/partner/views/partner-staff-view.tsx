'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, KeyRound, Pencil, UserCog, UserMinus, UserPlus, Users, UserX } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ClientDate } from '@/components/ui/client-date';
import { EmptyState } from '@/components/ui/empty-state';
import { QueryErrorState } from '@/components/feedback/query-error-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { KpiCard, KpiGrid } from '@/features/admin/components/kpi-card';
import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { PartnerPanel } from '@/features/partner/components/partner-panel';
import { usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';
import { formatCount } from '@/features/admin/lib/format-admin';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import {
  ACTIVITY_LABELS,
  DEFAULT_WORK_SCHEDULE,
  STAFF_ROLES,
  STAFF_ROLE_LABELS,
  WEEKDAYS,
  activateStaffMember,
  createStaffMember,
  deactivateStaffMember,
  formatWorkSchedule,
  getStaffActivity,
  getStaffDashboard,
  listStaffMembers,
  resetStaffPassword,
  suspendStaffMember,
  unsuspendStaffMember,
  updateStaffMember,
  type StaffMember,
  type StaffRole,
  type WorkSchedule,
} from '@/services/staff-management';
import { cn } from '@/lib/utils';

function StaffStatusPill({ active, suspended }: { active: boolean; suspended?: boolean }) {
  if (suspended) {
    return (
      <span className="inline-flex rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-semibold text-orange-700 dark:text-orange-300">
        Suspended
      </span>
    );
  }
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold',
        active ? 'bg-success-muted text-success' : 'bg-muted text-muted-foreground',
      )}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function ScheduleFields({
  schedule,
  onChange,
}: {
  schedule: WorkSchedule;
  onChange: (s: WorkSchedule) => void;
}) {
  const toggleDay = (day: string) => {
    const days = schedule.days.includes(day)
      ? schedule.days.filter((d) => d !== day)
      : [...schedule.days, day];
    onChange({ ...schedule, days });
  };
  return (
    <div className="grid gap-2 sm:col-span-2 lg:col-span-5">
      <Label>Work schedule</Label>
      <div className="flex flex-wrap gap-1">
        {WEEKDAYS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => toggleDay(id)}
            className={cn(
              'rounded-md border px-2 py-1 text-[10px] font-medium',
              schedule.days.includes(id) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          type="time"
          value={schedule.start_time}
          onChange={(e) => onChange({ ...schedule, start_time: e.target.value.slice(0, 5) })}
          className="h-9 text-sm"
        />
        <Input
          type="time"
          value={schedule.end_time}
          onChange={(e) => onChange({ ...schedule, end_time: e.target.value.slice(0, 5) })}
          className="h-9 text-sm"
        />
      </div>
    </div>
  );
}

export function PartnerStaffView() {
  const queryClient = useQueryClient();
  const enabled = usePartnerQueriesEnabled();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<StaffRole>('pickup_agent');
  const [schedule, setSchedule] = useState<WorkSchedule>(DEFAULT_WORK_SCHEDULE);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<StaffRole>('pickup_agent');
  const [editSchedule, setEditSchedule] = useState<WorkSchedule>(DEFAULT_WORK_SCHEDULE);

  const dashQ = useQuery({
    queryKey: queryKeys.partnerStaffDashboard(),
    queryFn: getStaffDashboard,
    enabled,
    staleTime: STALE.adminDashboard,
  });

  const staffQ = useQuery({
    queryKey: queryKeys.partnerStaffMembers(),
    queryFn: listStaffMembers,
    enabled,
    staleTime: STALE.adminDashboard,
  });

  const activityQ = useQuery({
    queryKey: queryKeys.partnerStaffActivity(),
    queryFn: () => getStaffActivity(),
    enabled,
    staleTime: 30_000,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerStaffMembers() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerStaffDashboard() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerStaffActivity() });
  };

  const createM = useMutation({
    mutationFn: () =>
      createStaffMember({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        role,
        work_schedule: schedule,
      }),
    onSuccess: (r) => {
      toast.success(r.temporary_password ? `Staff created. Temp password: ${r.temporary_password}` : 'Staff created');
      setName('');
      setEmail('');
      setPhone('');
      invalidate();
    },
    onError: () => toast.error('Could not create staff'),
  });

  const updateM = useMutation({
    mutationFn: (id: string) =>
      updateStaffMember(id, {
        name: editName.trim(),
        phone: editPhone.trim() || undefined,
        role: editRole,
        work_schedule: editSchedule,
      }),
    onSuccess: () => {
      toast.success('Staff updated');
      setEditId(null);
      invalidate();
    },
    onError: () => toast.error('Could not update staff'),
  });

  const deactivateM = useMutation({
    mutationFn: deactivateStaffMember,
    onSuccess: () => { toast.success('Staff deactivated'); invalidate(); },
    onError: () => toast.error('Could not deactivate staff'),
  });

  const activateM = useMutation({
    mutationFn: activateStaffMember,
    onSuccess: () => { toast.success('Staff activated'); invalidate(); },
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
    onSuccess: () => { toast.success('Staff suspended'); invalidate(); },
    onError: () => toast.error('Could not suspend staff'),
  });

  const unsuspendM = useMutation({
    mutationFn: unsuspendStaffMember,
    onSuccess: () => { toast.success('Staff unsuspended'); invalidate(); },
    onError: () => toast.error('Could not unsuspend staff'),
  });

  const staff = staffQ.data ?? [];
  const dash = dashQ.data;

  const startEdit = (s: StaffMember) => {
    setEditId(s.id);
    setEditName(s.name);
    setEditPhone(s.phone ?? '');
    setEditRole((s.role as StaffRole) in STAFF_ROLE_LABELS ? (s.role as StaffRole) : 'pickup_agent');
    setEditSchedule(s.work_schedule ?? DEFAULT_WORK_SCHEDULE);
  };

  return (
    <PartnerContent className="space-y-5">
      <PartnerPageHeader
        title="Staff management"
        description="Create login accounts, assign roles and branches, and track team activity."
      />

      {dashQ.isError && (
        <QueryErrorState
          title="Could not load staff dashboard"
          message={getApiErrorMessage(dashQ.error)}
          onRetry={() => void dashQ.refetch()}
          isRetrying={dashQ.isFetching}
        />
      )}
      {staffQ.isError && (
        <QueryErrorState
          title="Could not load staff list"
          message={getApiErrorMessage(staffQ.error)}
          onRetry={() => void staffQ.refetch()}
          isRetrying={staffQ.isFetching}
        />
      )}

      {dashQ.isLoading ? (
        <Skeleton className="h-24 w-full rounded-2xl" />
      ) : dash ? (
        <KpiGrid className="sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Total staff" value={formatCount(dash.total_staff)} icon={Users} status="neutral" />
          <KpiCard label="Active staff" value={formatCount(dash.active_staff)} icon={UserCog} status="healthy" />
          <KpiCard label="Online now" value={formatCount(dash.online_staff)} icon={Activity} status="neutral" />
          <KpiCard label="Inactive staff" value={formatCount(dash.inactive_staff)} icon={UserX} status="warning" />
        </KpiGrid>
      ) : null}

      <PartnerPanel title="Create staff account" bodyClassName="px-4 py-4 sm:px-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="grid gap-1.5 lg:col-span-2">
            <Label htmlFor="staff-name">Full name</Label>
            <Input id="staff-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          </div>
          <div className="grid gap-1.5 lg:col-span-2">
            <Label htmlFor="staff-email">Email (login)</Label>
            <Input id="staff-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="staff@laundry.com" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="staff-phone">Phone</Label>
            <Input id="staff-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="staff-role">Role</Label>
            <Select id="staff-role" value={role} onChange={(e) => setRole(e.target.value as StaffRole)} className="h-10">
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r}>{STAFF_ROLE_LABELS[r]}</option>
              ))}
            </Select>
          </div>
          <ScheduleFields schedule={schedule} onChange={setSchedule} />
          <div className="flex items-end sm:col-span-2 lg:col-span-5">
            <Button type="button" disabled={!name.trim() || !email.trim() || createM.isPending} onClick={() => createM.mutate()}>
              Create staff
            </Button>
          </div>
        </div>
      </PartnerPanel>

      {staffQ.isLoading && <Skeleton className="h-48 w-full rounded-2xl" />}
      {!staffQ.isLoading && staff.length === 0 && (
        <EmptyState icon={UserCog} title="No staff yet" description="Create staff accounts with role-based login access." />
      )}

      {staff.length > 0 && (
        <PartnerPanel title="Team" meta={`${staff.length} members`} bodyClassName="divide-y divide-border/50 p-0">
          {staff.map((s) => (
            <div key={s.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              {editId === s.id ? (
                <div className="grid flex-1 gap-2 sm:grid-cols-2">
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-9 text-sm" />
                  <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="h-9 text-sm" placeholder="Phone" />
                  <Select value={editRole} onChange={(e) => setEditRole(e.target.value as StaffRole)} className="h-9 text-sm sm:col-span-2">
                    {STAFF_ROLES.map((r) => (
                      <option key={r} value={r}>{STAFF_ROLE_LABELS[r]}</option>
                    ))}
                  </Select>
                  <ScheduleFields schedule={editSchedule} onChange={setEditSchedule} />
                </div>
              ) : (
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{s.name}</p>
                    <StaffStatusPill active={s.is_active} suspended={s.is_suspended} />
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">{s.role_label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {s.email ?? '—'}{s.phone ? ` · ${s.phone}` : ''} · Branch: {s.laundry_name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{formatWorkSchedule(s.work_schedule)}</p>
                  {s.last_login_at && (
                    <p className="text-[10px] text-muted-foreground">
                      Last login <ClientDate iso={s.last_login_at} mode="datetime" />
                    </p>
                  )}
                </div>
              )}
              <div className="flex flex-wrap gap-1.5">
                {editId === s.id ? (
                  <>
                    <Button size="sm" disabled={updateM.isPending} onClick={() => updateM.mutate(s.id)}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditId(null)}>Cancel</Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => startEdit(s)}>
                      <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 gap-1" disabled={resetM.isPending} onClick={() => resetM.mutate(s.id)}>
                      <KeyRound className="h-3.5 w-3.5" aria-hidden /> Reset pwd
                    </Button>
                    {s.is_active && !s.is_suspended && (
                      <Button size="sm" variant="outline" className="h-8 gap-1" disabled={suspendM.isPending} onClick={() => suspendM.mutate(s.id)}>
                        <UserMinus className="h-3.5 w-3.5" aria-hidden /> Suspend
                      </Button>
                    )}
                    {s.is_suspended && (
                      <Button size="sm" variant="outline" className="h-8" disabled={unsuspendM.isPending} onClick={() => unsuspendM.mutate(s.id)}>
                        Unsuspend
                      </Button>
                    )}
                    {s.is_active && !s.is_suspended ? (
                      <Button size="sm" variant="outline" className="h-8 gap-1" disabled={deactivateM.isPending} onClick={() => deactivateM.mutate(s.id)}>
                        <UserMinus className="h-3.5 w-3.5" aria-hidden /> Deactivate
                      </Button>
                    ) : !s.is_active ? (
                      <Button size="sm" variant="outline" className="h-8" disabled={activateM.isPending} onClick={() => activateM.mutate(s.id)}>
                        Activate
                      </Button>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          ))}
        </PartnerPanel>
      )}

      <PartnerPanel title="Activity log" bodyClassName="p-0">
        {activityQ.isError && (
          <div className="p-4">
            <QueryErrorState
              title="Could not load activity"
              message={getApiErrorMessage(activityQ.error)}
              onRetry={() => void activityQ.refetch()}
              isRetrying={activityQ.isFetching}
            />
          </div>
        )}
        {activityQ.isLoading && <Skeleton className="m-4 h-32 w-full" />}
        {!activityQ.isLoading && (activityQ.data ?? []).length === 0 && (
          <p className="px-4 py-6 text-sm text-muted-foreground">No activity recorded yet.</p>
        )}
        <div className="divide-y divide-border/50">
          {(activityQ.data ?? []).map((row) => (
            <div key={row.id} className="flex flex-col gap-0.5 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">{row.staff_name}</p>
                <p className="text-xs text-muted-foreground">{row.description ?? ACTIVITY_LABELS[row.action] ?? row.action}</p>
              </div>
              <ClientDate iso={row.created_at} mode="datetime" className="text-[10px] text-muted-foreground" />
            </div>
          ))}
        </div>
      </PartnerPanel>
    </PartnerContent>
  );
}
