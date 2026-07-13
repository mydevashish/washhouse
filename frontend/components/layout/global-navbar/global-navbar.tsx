'use client';

import dynamic from 'next/dynamic';
import { Menu, Search } from 'lucide-react';

import { WashhouseLogo } from '@/components/brand/washhouse-logo';
import { NavbarBackButton } from '@/components/layout/global-navbar/navbar-back-button';
import { NavbarBreadcrumbs } from '@/components/layout/global-navbar/navbar-breadcrumbs';
import { NavbarNotifications } from '@/components/layout/global-navbar/navbar-notifications';
import { NavbarQuickActions } from '@/components/layout/global-navbar/navbar-quick-actions';
import { NavbarThemeToggle } from '@/components/layout/global-navbar/navbar-theme-toggle';
import { NavbarUserMenu } from '@/components/layout/global-navbar/navbar-user-menu';
import type { AppContext } from '@/lib/navigation/types';
import type { UserRole } from '@/types/user';
import { cn } from '@/lib/utils';

const NavbarCommandSearch = dynamic(
  () =>
    import('@/components/layout/global-navbar/navbar-command-search').then((m) => ({
      default: m.NavbarCommandSearch,
    })),
  {
    ssr: false,
    loading: () => (
      <button
        type="button"
        className="inline-flex h-9 w-full max-w-sm items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 text-sm text-muted-foreground"
        aria-hidden
        tabIndex={-1}
      >
        <Search className="h-4 w-4 shrink-0" aria-hidden />
        <span>Search…</span>
      </button>
    ),
  },
);

export type GlobalNavbarProps = {
  app: AppContext;
  pageTitle: string;
  userRole?: UserRole;
  laundryName?: string;
  onOpenSidebar?: () => void;
  notificationsHref: string;
  settingsHref: string;
  className?: string;
};

export function GlobalNavbar({
  app,
  pageTitle,
  userRole,
  laundryName,
  onOpenSidebar,
  notificationsHref,
  settingsHref,
  className,
}: GlobalNavbarProps) {
  const showCustomerBrand = app === 'customer';

  return (
    <header
      className={cn(
        'sticky top-0 z-50 flex h-nav w-full min-w-0 shrink-0 items-center gap-1 border-b border-border/80 bg-background/90 px-2 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-background/75 overflow-x-clip sm:px-2.5',
        className,
      )}
    >
      {/* Left */}
      <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-1.5">
        {showCustomerBrand && <WashhouseLogo href="/" priority compact />}
        {onOpenSidebar && (
          <button
            type="button"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
            onClick={onOpenSidebar}
            aria-label="Open navigation menu"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}
        <NavbarBackButton app={app} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 overflow-hidden">
          <h1 className="truncate text-sm font-semibold leading-none text-foreground">{pageTitle}</h1>
          <NavbarBreadcrumbs app={app} />
        </div>
      </div>

      {/* Center — search */}
      <div className="hidden flex-1 justify-center md:flex">
        <NavbarCommandSearch app={app} />
      </div>

      {/* Right */}
      <div className="flex shrink-0 items-center gap-1">
        <div className="md:hidden">
          <NavbarCommandSearch app={app} />
        </div>
        <NavbarQuickActions app={app} role={userRole} />
        <div className="hidden sm:block">
          <NavbarNotifications app={app} viewAllHref={notificationsHref} />
        </div>
        <div className="hidden sm:block">
          <NavbarThemeToggle />
        </div>
        <NavbarUserMenu app={app} laundryName={laundryName} settingsHref={settingsHref} />
      </div>
    </header>
  );
}
