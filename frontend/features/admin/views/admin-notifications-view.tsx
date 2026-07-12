'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowRight, CreditCard, Store } from 'lucide-react';

import { AdminContent } from '@/features/admin/components/admin-content';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { AdminPanel } from '@/features/admin/components/admin-panel';
import { queryKeys } from '@/lib/query-keys';
import { getAdminDashboard } from '@/services/admin';

export function AdminNotificationsView() {
  const dashboardQ = useQuery({
    queryKey: queryKeys.adminDashboard(),
    queryFn: getAdminDashboard,
  });

  const d = dashboardQ.data;
  const items = [
    {
      id: 'approvals',
      show: (d?.laundries_pending ?? 0) > 0,
      icon: Store,
      title: 'Laundry approvals',
      body: `${d?.laundries_pending} pending`,
      href: '/admin/approvals',
    },
    {
      id: 'complaints',
      show: (d?.complaints_open ?? 0) > 0,
      icon: AlertTriangle,
      title: 'Open complaints',
      body: `${d?.complaints_open} need review`,
      href: '/admin/orders',
    },
    {
      id: 'orders',
      show: (d?.orders_today ?? 0) > 0,
      icon: CreditCard,
      title: 'Orders today',
      body: `${d?.orders_today} new`,
      href: '/admin/orders',
    },
  ].filter((i) => i.show);

  return (
    <AdminContent className="space-y-5">
      <AdminPageHeader title="Notifications" description="Signals that need attention." />

      <AdminPanel bodyClassName="p-0">
        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No active notifications — platform is healthy.
          </p>
        ) : (
          <ul className="divide-y divide-border/50">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.body}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </AdminPanel>
    </AdminContent>
  );
}
