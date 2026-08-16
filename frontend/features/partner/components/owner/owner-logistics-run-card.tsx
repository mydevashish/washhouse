'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Phone, UserRound } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ClientDate } from '@/components/ui/client-date';
import { Select } from '@/components/ui/select';
import { PartnerStatusBadge } from '@/features/partner/components/partner-status-badge';
import { getApiErrorMessage } from '@/lib/api-error-message';
import {
  getPartnerAdvanceLabel,
  getPartnerNextStatus,
  isOrderNeedsAction,
} from '@/features/partner/lib/partner-status';
import {
  logisticsRunFamily,
  logisticsRunImage,
} from '@/features/partner/lib/owner-logistics';
import { staffHref } from '@/features/partner/lib/owner-staff';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';
import {
  assignDriver,
  reassignDriver,
  type DriverSummary,
  type OperationsOrderRow,
  type TaskAssignmentType,
} from '@/services/operations';
import { acceptOrder, updateOrderStatus } from '@/services/partner';

const PICKUP_ROLES = new Set(['pickup_agent', 'pickup_only', 'owner', 'manager', 'full_access']);
const DELIVERY_ROLES = new Set([
  'delivery_agent',
  'delivery_only',
  'owner',
  'manager',
  'full_access',
]);

function eligibleDrivers(drivers: DriverSummary[], taskType: TaskAssignmentType) {
  const roles = taskType === 'pickup' ? PICKUP_ROLES : DELIVERY_ROLES;
  return drivers.filter((d) => d.available && roles.has(d.role));
}

export function OwnerLogisticsRunCard({
  order,
  taskType,
  drivers,
  phone,
}: {
  order: OperationsOrderRow;
  taskType: TaskAssignmentType;
  drivers: DriverSummary[];
  /** Optional phone from partner orders map. */
  phone?: string | null;
}) {
  const queryClient = useQueryClient();
  const family = logisticsRunFamily(order.status);
  const image = logisticsRunImage(family);
  const eligible = eligibleDrivers(drivers, taskType);
  const [staffId, setStaffId] = useState(eligible[0]?.staff_id ?? '');

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerOperationsPickups() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerOperationsDeliveries() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerOperationsDoneToday() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerOperationsDashboard() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerOperationsDrivers() });
    void queryClient.invalidateQueries({ queryKey: ['partner-orders'] });
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerAnalytics() });
  };

  const assignM = useMutation({
    mutationFn: () =>
      order.assignment
        ? reassignDriver(order.assignment.id, { staff_id: staffId })
        : assignDriver({ order_id: order.order_id, staff_id: staffId, task_type: taskType }),
    onSuccess: () => {
      toast.success(order.assignment ? 'Rider reassigned' : 'Rider assigned');
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not assign rider')),
  });

  const acceptM = useMutation({
    mutationFn: () => acceptOrder(order.order_id),
    onSuccess: () => {
      toast.success('Order accepted');
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not accept order')),
  });

  const advanceM = useMutation({
    mutationFn: (status: string) => updateOrderStatus(order.order_id, status),
    onSuccess: () => {
      toast.success('Status updated');
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not update status')),
  });

  const needsAccept = isOrderNeedsAction(order.status, 'online');
  const next = getPartnerNextStatus(order.status, 'online');
  const advanceLabel = getPartnerAdvanceLabel(order.status, 'online');
  const busy = acceptM.isPending || advanceM.isPending || assignM.isPending;
  const timeIso = taskType === 'pickup' ? order.pickup_at : order.delivery_at;
  const timeLabel = taskType === 'pickup' ? 'Pickup' : 'Delivery';

  return (
    <article
      className={cn(
        'overflow-hidden rounded-xl bg-card ring-1 ring-border/60',
        order.is_delayed && 'ring-warning/50',
      )}
    >
      <div className="flex gap-0 sm:gap-0">
        <div className="relative hidden w-24 shrink-0 sm:block">
          <Image src={image.src} alt={image.alt} fill sizes="96px" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/80" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 p-3 sm:p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <PartnerStatusBadge status={order.status} />
                {order.is_delayed ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-warning-muted px-1.5 py-0.5 text-[10px] font-semibold text-warning">
                    <AlertTriangle className="h-3 w-3" aria-hidden />
                    Delayed
                  </span>
                ) : null}
              </div>
              <h3 className="mt-1.5 truncate text-base font-semibold text-foreground">
                {order.customer_name}
              </h3>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">#{order.tracking_code}</p>
            </div>
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-1 ring-border/50 sm:hidden">
              <Image src={image.src} alt="" fill sizes="56px" className="object-cover" />
            </div>
          </div>

          <dl className="mt-2 grid gap-1 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <dt className="sr-only">{timeLabel} window</dt>
              <dd>
                {timeLabel}{' '}
                <ClientDate iso={timeIso} mode="datetime" className="font-medium text-foreground" />
              </dd>
              {order.assignment ? (
                <dd className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 font-medium text-foreground">
                  <UserRound className="h-3 w-3" aria-hidden />
                  {order.assignment.staff_name}
                </dd>
              ) : null}
            </div>
          </dl>

          <div className="mt-3 flex flex-wrap gap-2">
            {phone ? (
              <Button type="button" size="sm" variant="outline" className="min-h-11 min-w-[7rem]" asChild>
                <a href={`tel:${phone}`}>
                  <Phone className="mr-1.5 h-4 w-4" aria-hidden />
                  Call
                </a>
              </Button>
            ) : null}
            <Button type="button" size="sm" variant="outline" className="min-h-11" asChild>
              <Link href={`/partner/orders/${order.order_id}`}>Open order</Link>
            </Button>
            {needsAccept ? (
              <Button
                type="button"
                size="sm"
                className="min-h-11 min-w-[7rem]"
                disabled={busy}
                onClick={() => acceptM.mutate()}
              >
                Accept
              </Button>
            ) : null}
            {!needsAccept && next && advanceLabel ? (
              <Button
                type="button"
                size="sm"
                className="min-h-11 min-w-[8rem]"
                disabled={busy}
                onClick={() => advanceM.mutate(next)}
              >
                {advanceLabel}
              </Button>
            ) : null}
          </div>

          {eligible.length > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/50 pt-3">
              <Select
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="h-11 min-w-[10rem] flex-1 text-sm sm:flex-none"
                aria-label="Assign rider"
              >
                {eligible.map((d) => (
                  <option key={d.staff_id} value={d.staff_id}>
                    {d.name} ({d.active_tasks}/{d.daily_capacity})
                  </option>
                ))}
              </Select>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="min-h-11"
                disabled={!staffId || busy}
                onClick={() => assignM.mutate()}
              >
                {order.assignment ? 'Reassign' : 'Assign rider'}
              </Button>
              <Button asChild size="sm" variant="ghost" className="min-h-11">
                <Link
                  href={staffHref({
                    capability: taskType === 'pickup' ? 'pickup' : 'delivery',
                  })}
                >
                  Staff roster
                </Link>
              </Button>
            </div>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              No available {taskType === 'pickup' ? 'pickup' : 'delivery'} staff —{' '}
              <Link
                href={staffHref({
                  capability: taskType === 'pickup' ? 'pickup' : 'delivery',
                  action: 'add',
                })}
                className="font-medium text-foreground underline-offset-2 hover:underline"
              >
                add a helper
              </Link>
              .
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
