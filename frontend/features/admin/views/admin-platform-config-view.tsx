'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ClientDate } from '@/components/ui/client-date';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { InfoBanner } from '@/components/ui/info-banner';
import { AdminContent } from '@/features/admin/components/admin-content';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { AdminPanel } from '@/features/admin/components/admin-panel';
import { PlatformConfigCommissionSection } from '@/features/admin/platform-config/platform-config-commission-section';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { cn } from '@/lib/utils';
import {
  getPlatformConfig,
  getPlatformConfigAudit,
  updateDisputeSettings,
  updateNotificationSettings,
  updateOrderSettings,
  updateSessionSettings,
} from '@/services/platform-config';

type SectionId = 'commission' | 'order' | 'dispute' | 'session' | 'notification' | 'audit';

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'commission', label: 'Commission' },
  { id: 'order', label: 'Orders' },
  { id: 'dispute', label: 'Disputes' },
  { id: 'session', label: 'Session' },
  { id: 'notification', label: 'Notifications' },
  { id: 'audit', label: 'Audit log' },
];

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-2 text-sm">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />
    </label>
  );
}

export function AdminPlatformConfigView() {
  const queryClient = useQueryClient();
  const [section, setSection] = useState<SectionId>('commission');

  const configQ = useQuery({
    queryKey: queryKeys.adminPlatformConfig(),
    queryFn: getPlatformConfig,
    staleTime: STALE.adminDashboard,
  });
  const auditQ = useQuery({
    queryKey: queryKeys.adminPlatformConfigAudit(),
    queryFn: () => getPlatformConfigAudit(50),
    staleTime: 30_000,
    enabled: section === 'audit',
  });

  const cfg = configQ.data;
  const [minAmt, setMinAmt] = useState('99');
  const [maxAmt, setMaxAmt] = useState('50000');
  const [pickupKm, setPickupKm] = useState('5');
  const [deliveryKm, setDeliveryKm] = useState('8');
  const [disputeH, setDisputeH] = useState('48');
  const [refundH, setRefundH] = useState('48');
  const [slaLow, setSlaLow] = useState('72');
  const [slaMed, setSlaMed] = useState('48');
  const [slaHigh, setSlaHigh] = useState('24');
  const [slaCrit, setSlaCrit] = useState('4');
  const [idleMin, setIdleMin] = useState('30');
  const [warnMin, setWarnMin] = useState('5');
  const [notify, setNotify] = useState({ email: true, sms: true, push: true, in_app: true });

  useEffect(() => {
    if (!cfg) return;
    setMinAmt(cfg.order.min_amount_inr);
    setMaxAmt(cfg.order.max_amount_inr);
    setPickupKm(cfg.order.pickup_radius_km);
    setDeliveryKm(cfg.order.delivery_radius_km);
    setDisputeH(cfg.dispute.dispute_window_hours);
    setRefundH(cfg.dispute.refund_window_hours);
    setSlaLow(String(cfg.dispute.sla_hours.low ?? 72));
    setSlaMed(String(cfg.dispute.sla_hours.medium ?? 48));
    setSlaHigh(String(cfg.dispute.sla_hours.high ?? 24));
    setSlaCrit(String(cfg.dispute.sla_hours.critical ?? 4));
    setIdleMin(cfg.session.idle_timeout_minutes);
    setWarnMin(cfg.session.warning_timeout_minutes);
    setNotify({
      email: cfg.notification.email_enabled,
      sms: cfg.notification.sms_enabled,
      push: cfg.notification.push_enabled,
      in_app: cfg.notification.in_app_enabled,
    });
  }, [cfg]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.adminPlatformConfig() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.adminPlatformConfigAudit() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.adminCommission() });
  };

  const saveOrderM = useMutation({
    mutationFn: () =>
      updateOrderSettings({
        min_amount_inr: Number(minAmt),
        max_amount_inr: Number(maxAmt),
        pickup_radius_km: Number(pickupKm),
        delivery_radius_km: Number(deliveryKm),
      }),
    onSuccess: () => {
      toast.success('Order settings saved');
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not save order settings')),
  });

  const saveDisputeM = useMutation({
    mutationFn: () =>
      updateDisputeSettings({
        dispute_window_hours: Number(disputeH),
        refund_window_hours: Number(refundH),
        sla_hours: {
          low: Number(slaLow),
          medium: Number(slaMed),
          high: Number(slaHigh),
          critical: Number(slaCrit),
        },
      }),
    onSuccess: () => {
      toast.success('Dispute settings saved');
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not save dispute settings')),
  });

  const saveSessionM = useMutation({
    mutationFn: () =>
      updateSessionSettings({
        idle_timeout_minutes: Number(idleMin),
        warning_timeout_minutes: Number(warnMin),
      }),
    onSuccess: () => {
      toast.success('Session settings saved');
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not save session settings')),
  });

  const saveNotifyM = useMutation({
    mutationFn: () =>
      updateNotificationSettings({
        email_enabled: notify.email,
        sms_enabled: notify.sms,
        push_enabled: notify.push,
        in_app_enabled: notify.in_app,
      }),
    onSuccess: () => {
      toast.success('Notification settings saved');
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not save notification settings')),
  });

  if (configQ.isPending) {
    return (
      <AdminContent className="space-y-5">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-10 w-full max-w-xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </AdminContent>
    );
  }

  return (
    <AdminContent className="space-y-5">
      <AdminPageHeader
        title="Platform Configuration Center"
        description="Configure commissions, order limits, dispute rules, sessions, and notifications without developer deployment. Every change is audited."
      />

      {configQ.isError && (
        <InfoBanner variant="destructive" title="Could not load configuration">
          {getApiErrorMessage(configQ.error, 'GET /admin/platform-config failed')}
        </InfoBanner>
      )}

      <div
        className="flex max-w-full flex-wrap gap-0.5 rounded-lg bg-muted/60 p-0.5"
        role="tablist"
        aria-label="Configuration sections"
      >
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={section === s.id}
            onClick={() => setSection(s.id)}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              section === s.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === 'commission' && (
        <PlatformConfigCommissionSection config={cfg} onSaved={invalidate} />
      )}

      {section === 'order' && (
        <AdminPanel title="Order settings" bodyClassName="space-y-3 px-4 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="min-order">Minimum order value (₹)</Label>
              <Input id="min-order" type="number" className="h-9" value={minAmt} onChange={(e) => setMinAmt(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="max-order">Maximum order value (₹)</Label>
              <Input id="max-order" type="number" className="h-9" value={maxAmt} onChange={(e) => setMaxAmt(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pickup-radius">Pickup radius (km)</Label>
              <Input id="pickup-radius" type="number" className="h-9" value={pickupKm} onChange={(e) => setPickupKm(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="delivery-radius">Delivery radius (km)</Label>
              <Input id="delivery-radius" type="number" className="h-9" value={deliveryKm} onChange={(e) => setDeliveryKm(e.target.value)} />
            </div>
          </div>
          <Button size="sm" disabled={saveOrderM.isPending} onClick={() => saveOrderM.mutate()}>
            Save order settings
          </Button>
        </AdminPanel>
      )}

      {section === 'dispute' && (
        <AdminPanel title="Dispute settings" bodyClassName="space-y-3 px-4 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="dispute-window">Dispute window (hours after delivery)</Label>
              <Input id="dispute-window" type="number" className="h-9" value={disputeH} onChange={(e) => setDisputeH(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="refund-window">Refund window (hours)</Label>
              <Input id="refund-window" type="number" className="h-9" value={refundH} onChange={(e) => setRefundH(e.target.value)} />
            </div>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">SLA rules (hours by priority)</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ['Low', slaLow, setSlaLow, 'sla-low'],
              ['Medium', slaMed, setSlaMed, 'sla-med'],
              ['High', slaHigh, setSlaHigh, 'sla-high'],
              ['Critical', slaCrit, setSlaCrit, 'sla-crit'],
            ].map(([label, val, setVal, id]) => (
              <div key={id as string} className="grid gap-1">
                <Label htmlFor={id as string} className="text-[10px]">
                  {label as string}
                </Label>
                <Input
                  id={id as string}
                  type="number"
                  className="h-8 text-xs"
                  value={val as string}
                  onChange={(e) => (setVal as (v: string) => void)(e.target.value)}
                />
              </div>
            ))}
          </div>
          <Button size="sm" disabled={saveDisputeM.isPending} onClick={() => saveDisputeM.mutate()}>
            Save dispute settings
          </Button>
        </AdminPanel>
      )}

      {section === 'session' && (
        <AdminPanel title="Session settings" bodyClassName="space-y-3 px-4 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="idle-timeout">Idle timeout (minutes)</Label>
              <Input id="idle-timeout" type="number" className="h-9" value={idleMin} onChange={(e) => setIdleMin(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="warning-timeout">Warning timeout (minutes before logout)</Label>
              <Input id="warning-timeout" type="number" className="h-9" value={warnMin} onChange={(e) => setWarnMin(e.target.value)} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Clients read live values via <code className="text-[10px]">GET /api/v1/config/session</code>.
          </p>
          <Button size="sm" disabled={saveSessionM.isPending} onClick={() => saveSessionM.mutate()}>
            Save session settings
          </Button>
        </AdminPanel>
      )}

      {section === 'notification' && (
        <AdminPanel title="Notification settings" description="Toggle delivery channels platform-wide" bodyClassName="divide-y divide-border/50 px-4 py-2">
          <ToggleRow label="Email" checked={notify.email} onChange={(v) => setNotify((n) => ({ ...n, email: v }))} />
          <ToggleRow label="SMS" checked={notify.sms} onChange={(v) => setNotify((n) => ({ ...n, sms: v }))} />
          <ToggleRow label="Push" checked={notify.push} onChange={(v) => setNotify((n) => ({ ...n, push: v }))} />
          <ToggleRow label="In-app" checked={notify.in_app} onChange={(v) => setNotify((n) => ({ ...n, in_app: v }))} />
          <div className="pt-3">
            <Button size="sm" disabled={saveNotifyM.isPending} onClick={() => saveNotifyM.mutate()}>
              Save notifications
            </Button>
          </div>
        </AdminPanel>
      )}

      {section === 'audit' && (
        <AdminPanel title="Configuration audit log" meta="Last 50 changes" bodyClassName="divide-y divide-border/50 p-0">
          {auditQ.isLoading && <Skeleton className="m-4 h-24 w-full" />}
          {auditQ.isError && (
            <p className="px-4 py-6 text-sm text-destructive">
              {getApiErrorMessage(auditQ.error, 'Could not load audit log')}
            </p>
          )}
          {(auditQ.data ?? []).length === 0 && !auditQ.isLoading && !auditQ.isError && (
            <p className="px-4 py-6 text-sm text-muted-foreground">No configuration changes recorded yet.</p>
          )}
          {(auditQ.data ?? []).map((row) => (
            <div key={row.id} className="flex flex-col gap-0.5 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">
                  {row.user_name}
                  {row.category && (
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-normal text-muted-foreground">
                      {row.category}
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {row.key}: {row.old_value ?? '—'} → {row.new_value ?? '—'}
                </p>
              </div>
              <ClientDate iso={row.timestamp} mode="datetime" className="text-[10px] text-muted-foreground" />
            </div>
          ))}
        </AdminPanel>
      )}
    </AdminContent>
  );
}
