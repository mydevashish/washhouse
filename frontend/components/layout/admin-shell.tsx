'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { SkipToContent } from '@/components/accessibility/skip-to-content';
import { AnnouncementBannerStack } from '@/components/announcements/announcement-banner';
import { GlobalNavbar } from '@/components/layout/global-navbar';
import {
  ADMIN_NAV_SECTIONS,
  getAdminPageTitle,
  isAdminNavActive,
} from '@/features/admin/lib/admin-nav';
import { useScrollRestore } from '@/hooks/use-scroll-restore';
import { useMounted } from '@/lib/hooks/use-mounted';
import { cn } from '@/lib/utils';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { getAdminDashboard } from '@/services/admin';
import { useAuthStore } from '@/store/auth.store';

function SidebarNav({
  pathname,
  badges,
  onNavigate,
}: {
  pathname: string;
  badges: { approvals: number; complaints: number };
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-2 py-2" aria-label="Admin navigation">
      {ADMIN_NAV_SECTIONS.map((section) => (
        <div key={section.id}>
          <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            {section.label}
          </p>
          <ul className="flex flex-col gap-0.5">
            {section.items.map(({ href, label, icon: Icon, badgeKey }) => {
              const active = isAdminNavActive(pathname, href);
              const badge =
                badgeKey === 'approvals'
                  ? badges.approvals
                  : badgeKey === 'complaints'
                    ? badges.complaints
                    : 0;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                    )}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="flex-1 truncate">{label}</span>
                    {badge > 0 && (
                      <span
                        className={cn(
                          'flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold',
                          active
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-warning-muted text-warning',
                        )}
                      >
                        {badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarContent({
  pathname,
  badges,
  user,
  onNavigate,
}: {
  pathname: string;
  badges: { approvals: number; complaints: number };
  user: { full_name?: string | null; email?: string | null } | null;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border/60 px-3 py-3">
        <Link href="/admin" className="flex items-center gap-2" onClick={onNavigate}>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground">
            D
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">DLM Ops</p>
            <p className="text-[10px] text-muted-foreground">Admin</p>
          </div>
        </Link>
      </div>
      <SidebarNav pathname={pathname} badges={badges} onNavigate={onNavigate} />
      <div className="shrink-0 border-t border-border/60 px-3 py-2.5 text-[11px] text-muted-foreground">
        <p className="truncate font-medium text-foreground">{user?.full_name ?? 'Admin'}</p>
        <p className="truncate">{user?.email}</p>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const mounted = useMounted();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [mobileOpen, setMobileOpen] = useState(false);

  useScrollRestore();

  const dashboardQ = useQuery({
    queryKey: queryKeys.adminDashboard(),
    queryFn: getAdminDashboard,
    enabled: mounted && Boolean(accessToken),
    staleTime: STALE.adminDashboard,
  });

  const badges = mounted
    ? {
        approvals: dashboardQ.data?.laundries_pending ?? 0,
        complaints: dashboardQ.data?.complaints_open ?? 0,
      }
    : { approvals: 0, complaints: 0 };

  const sidebarUser = mounted ? user : null;

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20">
      <SkipToContent />
      <aside className="hidden h-full w-sidebar shrink-0 flex-col border-r border-border bg-background lg:flex">
        <SidebarContent pathname={pathname} badges={badges} user={sidebarUser} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="overlay-scrim absolute inset-0"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-64 max-w-[85vw] flex-col bg-background shadow-xl">
            <button
              type="button"
              className="absolute right-2 top-2 z-10 rounded-lg p-2 hover:bg-muted"
              onClick={() => setMobileOpen(false)}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent
              pathname={pathname}
              badges={badges}
              user={sidebarUser}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <GlobalNavbar
          app="admin"
          pageTitle={getAdminPageTitle(pathname)}
          userRole={mounted ? user?.role : undefined}
          onOpenSidebar={() => setMobileOpen(true)}
          notificationsHref="/admin/notifications"
          settingsHref="/admin/settings"
        />

        <main
          id="main-content"
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden focus:outline-none"
          tabIndex={-1}
        >
          {mounted && user && <AnnouncementBannerStack />}
          {children}
        </main>
      </div>
    </div>
  );
}
