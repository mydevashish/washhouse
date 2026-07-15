'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ClipboardList,
  Clock,
  MapPin,
  Truck,
  UserCheck,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ClientDate } from '@/components/ui/client-date';
import { EmptyState } from '@/components/ui/empty-state';
import { QueryErrorState } from '@/components/feedback/query-error-state';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { PartnerKpiCard, PartnerKpiGrid } from '@/features/partner/components/partner-kpi-card';
import { PartnerPanel } from '@/features/partner/components/partner-panel';
import { usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import {
  assignDriver,
  getDeliveryQueue,
  getOperationsDashboard,
  getPickupQueue,
  listOperationsDrivers,
  reassignDriver,
  updateAssignmentStatus,
  type DriverSummary,
  type OperationsOrderRow,
  type QueueBucket,
  type TaskAssignmentType,
} from '@/services/operations';
import { cn } from '@/lib/utils';

type OpsTab = 'dashboard' | 'pickups' | 'deliveries' | 'drivers';

const TABS: { id: OpsTab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'pickups', label: 'Pickup queue' },
  { id: 'deliveries', label: 'Delivery queue' },
  { id: 'drivers', label: 'Drivers' },
];

function OpsTabNav({ active, onChange }: { active: OpsTab; onChange: (t: OpsTab) => void }) {
  return (
    <nav className="flex flex-wrap gap-1.5 rounded-xl border border-border bg-muted/30 p-1.5" aria-label="Operations sections">
      {TABS.map(({ id, label }) => (
        <Button
          key={id}
          type="button"
          variant={active === id ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onChange(id)}
          className={cn(
            'rounded-lg px-3 py-2 text-xs font-semibold sm:text-sm',
            active !== id && 'text-muted-foreground hover:bg-background',
          )}
          aria-current={active === id ? 'page' : undefined}
        >
          {label}
        </Button>
      ))}
    </nav>
  );
}

function DriverAssignControls({
  order,
  taskType,
  drivers,
  onDone,
}: {
  order: OperationsOrderRow;
  taskType: TaskAssignmentType;
  drivers: DriverSummary[];
  onDone: () => void;
}) {
  const eligible = drivers.filter((d) => d.available && (
    taskType === 'pickup'
      ? ['pickup_agent', 'pickup_only', 'owner', 'manager', 'full_access'].includes(d.role)
      : ['delivery_agent', 'delivery_only', 'owner', 'manager', 'full_access'].includes(d.role)
  ));
  const [staffId, setStaffId] = useState(eligible[0]?.staff_id ?? '');

  const assignM = useMutation({
    mutationFn: () =>
      order.assignment
        ? reassignDriver(order.assignment.id, { staff_id: staffId })
        : assignDriver({ order_id: order.order_id, staff_id: staffId, task_type: taskType }),
    onSuccess: () => { toast.success('Driver assigned'); onDone(); },
    onError: () => toast.error('Could not assign driver'),
  });

  const startM = useMutation({
    mutationFn: () => updateAssignmentStatus(order.assignment!.id, { status: 'in_progress' }),
    onSuccess: () => { toast.success('Task started'); onDone(); },
    onError: () => toast.error('Could not start task'),
  });

  const failM = useMutation({
    mutationFn: () => updateAssignmentStatus(order.assignment!.id, { status: 'failed' }),
    onSuccess: () => { toast.success('Marked as failed'); onDone(); },
    onError: () => toast.error('Could not update status'),
  });

  const returnM = useMutation({
    mutationFn: () => updateAssignmentStatus(order.assignment!.id, { status: 'returned' }),
    onSuccess: () => { toast.success('Marked as returned'); onDone(); },
    onError: () => toast.error('Could not update status'),
  });

  if (eligible.length === 0) {
    return <p className="text-xs text-muted-foreground">No available drivers</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={staffId} onChange={(e) => setStaffId(e.target.value)} className="h-8 min-w-[140px] text-xs">
        {eligible.map((d) => (
          <option key={d.staff_id} value={d.staff_id}>
            {d.name} ({d.active_tasks}/{d.daily_capacity})
          </option>
        ))}
      </Select>
      <Button size="sm" variant="outline" className="h-8" disabled={!staffId || assignM.isPending} onClick={() => assignM.mutate()}>
        {order.assignment ? 'Reassign' : 'Assign'}
      </Button>
      {order.assignment && order.assignment.status === 'assigned' && (
        <Button size="sm" variant="outline" className="h-8" disabled={startM.isPending} onClick={() => startM.mutate()}>
          Start
        </Button>
      )}
      {taskType === 'delivery' && order.assignment && ['assigned', 'in_progress'].includes(order.assignment.status) && (
        <>
          <Button size="sm" variant="outline" className="h-8" disabled={failM.isPending} onClick={() => failM.mutate()}>
            Failed
          </Button>
          <Button size="sm" variant="outline" className="h-8" disabled={returnM.isPending} onClick={() => returnM.mutate()}>
            Returned
          </Button>
        </>
      )}
    </div>
  );
}

function QueueOrderRow({
  order,
  taskType,
  drivers,
  onDone,
}: {
  order: OperationsOrderRow;
  taskType: TaskAssignmentType;
  drivers: DriverSummary[];
  onDone: () => void;
}) {
  const showAssign = ['scheduled', 'assigned', 'ready', 'out_for_delivery'].includes(order.queue_status);
  return (
    <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">#{order.tracking_code}</p>
          {order.is_delayed && (
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
              Delayed
            </span>
          )}
          {order.assignment && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
              {order.assignment.staff_name}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {order.customer_name} · Pickup <ClientDate iso={order.pickup_at} mode="datetime" /> · Delivery{' '}
          <ClientDate iso={order.delivery_at} mode="datetime" />
        </p>
      </div>
      {showAssign && <DriverAssignControls order={order} taskType={taskType} drivers={drivers} onDone={onDone} />}
    </div>
  );
}

function QueueSection({
  buckets,
  taskType,
  drivers,
  onDone,
}: {
  buckets: QueueBucket[];
  taskType: TaskAssignmentType;
  drivers: DriverSummary[];
  onDone: () => void;
}) {
  const [activeBucket, setActiveBucket] = useState(buckets[0]?.status ?? '');
  const bucket = buckets.find((b) => b.status === activeBucket) ?? buckets[0];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {buckets.map((b) => (
          <Button
            key={b.status}
            type="button"
            variant={activeBucket === b.status ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setActiveBucket(b.status)}
            className="rounded-full px-3 py-1 text-xs font-semibold"
          >
            {b.label} ({b.count})
          </Button>
        ))}
      </div>
      <PartnerPanel title={bucket?.label ?? 'Queue'} meta={`${bucket?.count ?? 0} orders`} bodyClassName="divide-y divide-border/50 p-0">
        {(bucket?.orders ?? []).length === 0 && (
          <p className="px-4 py-6 text-sm text-muted-foreground">No orders in this queue.</p>
        )}
        {(bucket?.orders ?? []).map((order) => (
          <QueueOrderRow key={order.order_id} order={order} taskType={taskType} drivers={drivers} onDone={onDone} />
        ))}
      </PartnerPanel>
    </div>
  );
}

function DriversPanel({ drivers }: { drivers: DriverSummary[] }) {
  if (drivers.length === 0) {
    return (
      <EmptyState icon={Users} title="No drivers" description="Add pickup or delivery agents in Staff management." />
    );
  }
  return (
    <PartnerPanel title="Driver workload" bodyClassName="divide-y divide-border/50 p-0">
      {drivers.map((d) => (
        <div key={d.staff_id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{d.name}</p>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">{d.role_label}</span>
              {!d.available && (
                <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold text-warning">At capacity</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {d.completed_today} completed today · capacity {d.active_tasks}/{d.daily_capacity}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
              <div
                className={cn('h-full rounded-full', d.workload_pct >= 90 ? 'bg-destructive' : d.workload_pct >= 70 ? 'bg-warning' : 'bg-success')}
                style={{ width: `${Math.min(100, d.workload_pct)}%` }}
              />
            </div>
            <span className="text-xs font-medium tabular-nums">{d.workload_pct}%</span>
          </div>
        </div>
      ))}
    </PartnerPanel>
  );
}

export function PartnerOperationsView() {
  const queryClient = useQueryClient();
  const enabled = usePartnerQueriesEnabled();
  const [tab, setTab] = useState<OpsTab>('dashboard');

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerOperations() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerOperationsDashboard() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerOperationsPickups() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerOperationsDeliveries() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerOperationsDrivers() });
  };

  const dashQ = useQuery({
    queryKey: queryKeys.partnerOperationsDashboard(),
    queryFn: getOperationsDashboard,
    enabled,
    staleTime: STALE.adminDashboard,
  });

  const pickupQ = useQuery({
    queryKey: queryKeys.partnerOperationsPickups(),
    queryFn: getPickupQueue,
    enabled: enabled && tab === 'pickups',
    staleTime: 30_000,
  });

  const deliveryQ = useQuery({
    queryKey: queryKeys.partnerOperationsDeliveries(),
    queryFn: getDeliveryQueue,
    enabled: enabled && tab === 'deliveries',
    staleTime: 30_000,
  });

  const driversQ = useQuery({
    queryKey: queryKeys.partnerOperationsDrivers(),
    queryFn: listOperationsDrivers,
    enabled: enabled && (tab === 'pickups' || tab === 'deliveries' || tab === 'drivers'),
    staleTime: STALE.adminDashboard,
  });

  const drivers = driversQ.data ?? [];
  const dash = dashQ.data;
  const loading = !enabled || dashQ.isPending;

  const pickupBuckets = useMemo(() => pickupQ.data?.buckets ?? [], [pickupQ.data]);
  const deliveryBuckets = useMemo(() => deliveryQ.data?.buckets ?? [], [deliveryQ.data]);

  return (
    <PartnerContent className="space-y-5">
      <PartnerPageHeader
        title="Operations center"
        description="Pickup & delivery queues, driver assignment, and live operations metrics."
      />

      <OpsTabNav active={tab} onChange={setTab} />

      {tab === 'dashboard' && dashQ.isError && (
        <QueryErrorState
          title="Could not load operations dashboard"
          message={getApiErrorMessage(dashQ.error)}
          onRetry={() => void dashQ.refetch()}
          isRetrying={dashQ.isFetching}
        />
      )}

      {tab === 'dashboard' && (
        <>
          <PartnerKpiGrid>
            <PartnerKpiCard label="Pickups today" value={dash ? String(dash.todays_pickups) : '—'} icon={MapPin} loading={loading} />
            <PartnerKpiCard label="Deliveries today" value={dash ? String(dash.todays_deliveries) : '—'} icon={Truck} loading={loading} />
            <PartnerKpiCard
              label="Avg delivery time"
              value={dash?.avg_delivery_time_minutes != null ? `${dash.avg_delivery_time_minutes} min` : '—'}
              icon={Clock}
              loading={loading}
            />
            <PartnerKpiCard
              label="Delayed orders"
              value={dash ? String(dash.delayed_orders) : '—'}
              icon={AlertTriangle}
              loading={loading}
              accent={dash && dash.delayed_orders > 0 ? 'warning' : 'default'}
            />
            <PartnerKpiCard
              label="Failed deliveries"
              value={dash ? String(dash.failed_deliveries) : '—'}
              icon={AlertTriangle}
              loading={loading}
              accent={dash && dash.failed_deliveries > 0 ? 'warning' : 'default'}
            />
            <PartnerKpiCard label="Pending assignments" value={dash ? String(dash.pending_tasks) : '—'} icon={ClipboardList} loading={loading} accent="warning" />
            <PartnerKpiCard label="Active drivers" value={dash ? String(dash.active_drivers) : '—'} icon={UserCheck} loading={loading} />
          </PartnerKpiGrid>
          {loading && <Skeleton className="h-32 w-full rounded-2xl" />}
          {!loading && dash && (
            <PartnerPanel title="Quick summary" bodyClassName="px-4 py-4">
              <p className="text-sm text-muted-foreground">
                {dash.laundry_name} · {dash.pending_tasks} tasks need assignment · {dash.delayed_orders} orders past schedule
              </p>
            </PartnerPanel>
          )}
        </>
      )}

      {tab === 'pickups' && (
        <>
          {pickupQ.isError && (
            <QueryErrorState
              title="Could not load pickup queue"
              message={getApiErrorMessage(pickupQ.error)}
              onRetry={() => void pickupQ.refetch()}
              isRetrying={pickupQ.isFetching}
            />
          )}
          {pickupQ.isPending && <Skeleton className="h-64 w-full rounded-2xl" />}
          {!pickupQ.isPending && pickupBuckets.every((b) => b.count === 0) && (
            <EmptyState icon={MapPin} title="No pickups" description="Scheduled pickups will appear in the queue." />
          )}
          {!pickupQ.isPending && pickupBuckets.some((b) => b.count > 0) && (
            <QueueSection buckets={pickupBuckets} taskType="pickup" drivers={drivers} onDone={invalidate} />
          )}
        </>
      )}

      {tab === 'deliveries' && (
        <>
          {deliveryQ.isError && (
            <QueryErrorState
              title="Could not load delivery queue"
              message={getApiErrorMessage(deliveryQ.error)}
              onRetry={() => void deliveryQ.refetch()}
              isRetrying={deliveryQ.isFetching}
            />
          )}
          {deliveryQ.isPending && <Skeleton className="h-64 w-full rounded-2xl" />}
          {!deliveryQ.isPending && deliveryBuckets.every((b) => b.count === 0) && (
            <EmptyState icon={Truck} title="No deliveries" description="Ready orders will appear in the delivery queue." />
          )}
          {!deliveryQ.isPending && deliveryBuckets.some((b) => b.count > 0) && (
            <QueueSection buckets={deliveryBuckets} taskType="delivery" drivers={drivers} onDone={invalidate} />
          )}
        </>
      )}

      {tab === 'drivers' && (
        <>
          {driversQ.isError && (
            <QueryErrorState
              title="Could not load drivers"
              message={getApiErrorMessage(driversQ.error)}
              onRetry={() => void driversQ.refetch()}
              isRetrying={driversQ.isFetching}
            />
          )}
          {driversQ.isPending && <Skeleton className="h-48 w-full rounded-2xl" />}
          {!driversQ.isPending && <DriversPanel drivers={drivers} />}
        </>
      )}
    </PartnerContent>
  );
}
