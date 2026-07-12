'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { AppContext } from '@/lib/navigation/types';
import { useMounted } from '@/lib/hooks/use-mounted';
import { useNavNotificationsStore } from '@/store/nav-notifications.store';
import { cn } from '@/lib/utils';

export function NavbarNotifications({
  app,
  viewAllHref,
}: {
  app: AppContext;
  viewAllHref: string;
}) {
  const mounted = useMounted();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const ensureSeeded = useNavNotificationsStore((s) => s.ensureSeeded);
  const markRead = useNavNotificationsStore((s) => s.markRead);
  const markAllRead = useNavNotificationsStore((s) => s.markAllRead);
  const unreadCount = useNavNotificationsStore((s) => s.unreadCount);
  const items = useNavNotificationsStore((s) => s.byApp[app] ?? []);

  useEffect(() => {
    if (!mounted) return;
    ensureSeeded(app);
  }, [app, ensureSeeded, mounted]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const unread = mounted ? unreadCount(app) : 0;
  const displayItems = mounted ? items : [];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="relative inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Bell className="h-3.5 w-3.5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-bold leading-none text-primary-foreground">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && mounted && (
        <div className="absolute right-0 top-full z-50 mt-1 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border/60 bg-background shadow-lg">
          <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
            <p className="text-sm font-semibold">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => markAllRead(app)}
              >
                Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-80 overflow-y-auto p-1">
            {displayItems.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">No notifications</li>
            ) : (
              displayItems.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.href}
                    onClick={() => {
                      markRead(app, n.id);
                      setOpen(false);
                    }}
                    className={cn(
                      'block rounded-lg px-3 py-2.5 transition-colors hover:bg-muted',
                      !n.read && 'bg-primary/5',
                    )}
                  >
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                  </Link>
                </li>
              ))
            )}
          </ul>
          <div className="border-t border-border/60 p-2">
            <Link
              href={viewAllHref}
              className="block rounded-lg py-2 text-center text-xs font-medium text-primary hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              View all
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
