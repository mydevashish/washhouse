import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { AppContext, NavNotification } from '@/lib/navigation/types';

/** Stable seed timestamp — never use Date.now() during store init (hydration-safe). */
const SEED_CREATED_AT = '2026-01-01T12:00:00.000Z';

function seedNotifications(app: AppContext): NavNotification[] {
  const now = SEED_CREATED_AT;
  if (app === 'admin') {
    return [
      {
        id: 'n1',
        title: 'Laundry approval pending',
        body: 'A new partner laundry is waiting for review.',
        href: '/admin/approvals',
        createdAt: now,
        read: false,
        kind: 'approval',
      },
      {
        id: 'n2',
        title: 'Open complaint',
        body: 'Customer reported delayed delivery.',
        href: '/admin/notifications',
        createdAt: now,
        read: false,
        kind: 'complaint',
      },
    ];
  }
  if (app === 'partner') {
    return [
      {
        id: 'n3',
        title: 'New order',
        body: 'You have a new booking awaiting confirmation.',
        href: '/partner/orders',
        createdAt: now,
        read: false,
        kind: 'order',
      },
      {
        id: 'n4',
        title: 'Pickup scheduled',
        body: 'Doorstep pickup in the next 2 hours.',
        href: '/partner/pickups',
        createdAt: now,
        read: true,
        kind: 'order',
      },
    ];
  }
  return [
    {
      id: 'n5',
      title: 'Order update',
      body: 'Your laundry is ready for delivery.',
      href: '/orders',
      createdAt: now,
      read: false,
      kind: 'order',
    },
  ];
}

interface NavNotificationsState {
  byApp: Partial<Record<AppContext, NavNotification[]>>;
  ensureSeeded: (app: AppContext) => void;
  markRead: (app: AppContext, id: string) => void;
  markAllRead: (app: AppContext) => void;
  unreadCount: (app: AppContext) => number;
}

export const useNavNotificationsStore = create<NavNotificationsState>()(
  persist(
    (set, get) => ({
      byApp: {},
      ensureSeeded: (app) => {
        if (get().byApp[app]?.length) return;
        set((s) => ({ byApp: { ...s.byApp, [app]: seedNotifications(app) } }));
      },
      markRead: (app, id) =>
        set((s) => ({
          byApp: {
            ...s.byApp,
            [app]: (s.byApp[app] ?? []).map((n) => (n.id === id ? { ...n, read: true } : n)),
          },
        })),
      markAllRead: (app) =>
        set((s) => ({
          byApp: {
            ...s.byApp,
            [app]: (s.byApp[app] ?? []).map((n) => ({ ...n, read: true })),
          },
        })),
      unreadCount: (app) => (get().byApp[app] ?? []).filter((n) => !n.read).length,
    }),
    {
      name: 'dlm.nav-notifications',
      skipHydration: true,
    },
  ),
);
