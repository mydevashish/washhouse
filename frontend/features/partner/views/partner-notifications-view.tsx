'use client';

import Link from 'next/link';
import { AlertTriangle, Bell, CreditCard, Package } from 'lucide-react';

import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { PartnerPanel } from '@/features/partner/components/partner-panel';
import { buildAttentionItems } from '@/features/partner/lib/partner-derive';
import { usePartnerOrders, usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';
import { useMounted } from '@/lib/hooks/use-mounted';

export function PartnerNotificationsView() {
  const mounted = useMounted();
  const queriesEnabled = usePartnerQueriesEnabled();
  const ordersQ = usePartnerOrders();
  const orders = mounted && queriesEnabled ? (ordersQ.data ?? []) : [];
  const attention = buildAttentionItems(
    orders,
    mounted && queriesEnabled ? Date.now() : undefined,
  );

  const paymentAlerts = orders.filter(
    (o) =>
      (o.payment_status === 'pending' || o.payment_status === 'pending_cod') &&
      o.status !== 'delivered' &&
      o.status !== 'cancelled',
  );

  const items = [
    ...attention.map((a) => ({
      id: a.id,
      icon: a.type === 'new_order' ? Package : AlertTriangle,
      title: a.title,
      body: a.description,
      href: '/partner/orders',
    })),
    ...paymentAlerts.map((o) => ({
      id: `pay-${o.id}`,
      icon: CreditCard,
      title: 'Payment pending',
      body: `Order #${o.tracking_code}`,
      href: '/partner/orders',
    })),
  ];

  return (
    <PartnerContent className="space-y-5">
      <PartnerPageHeader title="Notifications" description="Alerts that need your attention." />

      <PartnerPanel bodyClassName="p-0">
        {items.length === 0 ? (
          <p className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-muted-foreground">
            <Bell className="h-4 w-4" />
            All caught up — no new alerts.
          </p>
        ) : (
          <ul className="divide-y divide-border/50">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <Link href={item.href} className="flex gap-3 px-4 py-3 hover:bg-muted/40">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.body}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </PartnerPanel>
    </PartnerContent>
  );
}
