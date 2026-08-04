'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from '@/features/partner/lib/partner-nav';
import { usePartnerAnalytics } from '@/features/partner/hooks/use-partner-operations';
import { useScrollRestore } from '@/hooks/use-scroll-restore';
import { useMounted } from '@/lib/hooks/use-mounted';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';

function PartnerSidebar({
  pathname,
  badges,
  laundryName,
  userName,
  onNavigate,
}: {
  pathname: string;
  badges: {
    orders: number;
    pickups: number;
    notifications: number;
    bookingRequests: number;
  };
  laundryName?: string;
  userName?: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border/60 px-3 py-3">
        <Link href="/partner" className="block min-w-0" onClick={onNavigate}>
          <p className="truncate text-sm font-semibold">{laundryName ?? 'Your laundry'}</p>
          <p className="text-[10px] text-muted-foreground">Partner console</p>
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-2 py-3" aria-label="Partner navigation">
        {PARTNER_NAV_SECTIONS.map((section) => (
          <div key={section.id}>
            <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              {section.label}
            </p>
            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const { href, label, icon: Icon } = item;
                const active = isPartnerNavActive(pathname, href);
                const badge = partnerNavBadgeKeys(item).reduce((sum, key) => sum + (badges[key] ?? 0), 0);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      className={cn(
                        'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors',
                        active
                          ? 'bg-primary text-primary-foreground shadow-sm'
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
                              ? 'bg-primary-foreground/20 text-primary-foreground'
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
      <div className="shrink-0 border-t border-border/60 px-3 py-2.5 text-[11px] text-muted-foreground">
        <p className="truncate font-medium text-foreground">{userName ?? 'Partner'}</p>
      </div>
    </div>
  );
}

export function PartnerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
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

  const sidebar = (
    <PartnerSidebar
      pathname={pathname}
      badges={badges}
      laundryName={laundryName}
      userName={userName}
      onNavigate={() => setMobileOpen(false)}
    />
  );

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20">
      <aside className="hidden h-full w-sidebar shrink-0 flex-col border-r border-border bg-background lg:flex">
        {sidebar}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
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

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <GlobalNavbar
          app="partner"
          pageTitle={getPartnerPageTitle(pathname)}
          userRole={mounted ? user?.role : undefined}
          laundryName={mounted ? laundryName : undefined}
          onOpenSidebar={() => setMobileOpen(true)}
          notificationsHref="/partner/notifications"
          settingsHref="/partner/settings"
        />
        <main id="main-content" className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden" tabIndex={-1}>
          {mounted && user && <AnnouncementBannerStack />}
          {children}
        </main>
      </div>
    </div>
  );
}
