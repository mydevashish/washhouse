'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';
import { useState } from 'react';

import { GlobalNavbar } from '@/components/layout/global-navbar';
import { AnnouncementBannerStack } from '@/components/announcements/announcement-banner';
import { usePartnerBookingRequestsBadge } from '@/features/partner/booking-requests/hooks';
import { partnerBookingRequestsBadgeCount } from '@/features/partner/booking-requests/lib/partner-booking-status';
import { partnerBadges } from '@/features/partner/lib/partner-derive';
import {
  PARTNER_NAV_SECTIONS,
  getPartnerPageTitle,
  isPartnerNavActive,
  partnerNavBadgeKeys,
  stripNavQuery,
} from '@/features/partner/lib/partner-nav';
import { usePartnerAnalytics } from '@/features/partner/hooks/use-partner-operations';
import { PartnerPracticeModeBanner } from '@/features/partner-shop-floor/components/partner-practice-mode-banner';
import { useScrollRestore } from '@/hooks/use-scroll-restore';
import { useMounted } from '@/lib/hooks/use-mounted';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';

function PartnerAdvancedSidebar({
  pathname,
  tab,
  badges,
  laundryName,
  userName,
  ordersToday,
  onNavigate,
}: {
  pathname: string;
  tab?: string | null;
  badges: {
    orders: number;
    pickups: number;
    notifications: number;
    bookingRequests: number;
  };
  laundryName?: string;
  userName?: string;
  ordersToday?: number;
  onNavigate?: () => void;
}) {
  const navActiveOpts = { tab };
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border/60 px-3 py-3">
        <Link href="/partner" className="block min-w-0" onClick={onNavigate}>
          <p className="truncate text-sm font-semibold">{laundryName ?? 'Your laundry'}</p>
          <p className="text-[10px] text-muted-foreground">Owner command center</p>
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-2 py-3" aria-label="Partner navigation">
        {PARTNER_NAV_SECTIONS.map((section) => (
          <div key={section.id}>
            <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {section.label}
            </p>
            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const { href, label, icon: Icon } = item;
                const active = isPartnerNavActive(pathname, href, navActiveOpts);
                const badge = partnerNavBadgeKeys(item).reduce((sum, key) => sum + (badges[key] ?? 0), 0);
                return (
                  <li key={`${stripNavQuery(href)}:${label}`}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      className={cn(
                        'flex items-center gap-2.5 rounded-2xl px-3 py-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
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
                            'flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold',
                            active
                              ? 'bg-primary/15 text-primary'
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
      <div className="shrink-0 space-y-1.5 border-t border-border/60 px-3 py-2.5 text-[11px] text-muted-foreground">
        {ordersToday != null ? (
          <Link
            href="/partner"
            onClick={onNavigate}
            className="block rounded-lg px-1 py-0.5 font-medium text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Dashboard · {ordersToday} order{ordersToday === 1 ? '' : 's'}
          </Link>
        ) : null}
        <p className="truncate px-1 font-medium text-foreground">{userName ?? 'Partner'}</p>
      </div>
    </div>
  );
}

export function PartnerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ordersTab = searchParams.get('tab');
  const user = useAuthStore((s) => s.user);
  const [mobileOpen, setMobileOpen] = useState(false);

  useScrollRestore();

  const mounted = useMounted();
  // Badges from analytics only — avoid polling full orders list on every partner route.
  const analyticsQ = usePartnerAnalytics();
  const bookingBadgeQ = usePartnerBookingRequestsBadge();
  const baseBadges = mounted
    ? partnerBadges(analyticsQ.data, undefined, Date.now())
    : { orders: 0, pickups: 0, notifications: 0 };
  const badges = {
    ...baseBadges,
    bookingRequests: mounted
      ? partnerBookingRequestsBadgeCount({
          assignedTotal: bookingBadgeQ.data?.total,
          inbox: bookingBadgeQ.data?.inbox,
        })
      : 0,
  };
  const laundryName = mounted ? analyticsQ.data?.laundry_name : undefined;
  const userName = mounted ? user?.full_name : undefined;

  const ordersToday =
    mounted && analyticsQ.data?.orders_today != null ? analyticsQ.data.orders_today : undefined;

  const sidebar = (
    <PartnerAdvancedSidebar
      pathname={pathname}
      tab={ordersTab}
      badges={badges}
      laundryName={laundryName}
      userName={userName}
      ordersToday={ordersToday}
      onNavigate={() => setMobileOpen(false)}
    />
  );

  const pageTitle = getPartnerPageTitle(pathname, ordersTab);

  return (
    <div
      data-partner-shell
      className="flex h-dvh max-h-dvh min-h-0 overflow-hidden bg-muted/20"
    >
      <aside className="hidden h-full w-sidebar shrink-0 flex-col border-r border-border bg-background xl:flex">
        {sidebar}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <button
            type="button"
            className="absolute inset-0 overlay-scrim"
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
            {sidebar}
          </aside>
        </div>
      )}

      <div
        id="main-content"
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain"
        tabIndex={-1}
      >
        <GlobalNavbar
          app="partner"
          pageTitle={pageTitle}
          userRole={mounted ? user?.role : undefined}
          laundryName={mounted ? laundryName : undefined}
          onOpenSidebar={() => setMobileOpen(true)}
          sidebarFrom="xl"
          notificationsHref="/partner/notifications"
          settingsHref="/partner/settings"
        />
        <main className="min-h-0 flex-1 focus:outline-none">
          {mounted && user && <AnnouncementBannerStack />}
          {mounted && user ? <PartnerPracticeModeBanner /> : null}
          {children}
        </main>
      </div>
    </div>
  );
}
