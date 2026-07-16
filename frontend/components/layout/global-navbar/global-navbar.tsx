'use client';

import { Menu } from 'lucide-react';

import { WashhouseLogo } from '@/components/brand/washhouse-logo';
import { NavbarBackButton } from '@/components/layout/global-navbar/navbar-back-button';
import { NavbarBreadcrumbs } from '@/components/layout/global-navbar/navbar-breadcrumbs';
import {
  NavbarCommandSearchDesktopTrigger,
  NavbarCommandSearchMobileTrigger,
  NavbarCommandSearchRoot,
} from '@/components/layout/global-navbar/navbar-command-search';
import { NavbarNotifications } from '@/components/layout/global-navbar/navbar-notifications';
import { NavbarQuickActions } from '@/components/layout/global-navbar/navbar-quick-actions';
import { NavbarThemeToggle } from '@/components/layout/global-navbar/navbar-theme-toggle';
import { NavbarUserMenu } from '@/components/layout/global-navbar/navbar-user-menu';
import type { AppContext } from '@/lib/navigation/types';
import type { UserRole } from '@/types/user';
import { cn } from '@/lib/utils';

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
    <NavbarCommandSearchRoot app={app}>
      <header
        className={cn(
          'sticky top-0 z-50 flex h-nav w-full min-w-0 shrink-0 items-center gap-1 overflow-x-clip border-b border-border/80 bg-background/90 px-2 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-background/75 sm:px-2.5',
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

        {/* Center — search (desktop) */}
        <div className="hidden flex-1 justify-center md:flex">
          <NavbarCommandSearchDesktopTrigger />
        </div>

        {/* Right */}
        <div className="flex shrink-0 items-center gap-1">
          <NavbarCommandSearchMobileTrigger />
          <NavbarQuickActions app={app} role={userRole} />
          <div className="hidden sm:block">
            <NavbarNotifications app={app} viewAllHref={notificationsHref} />
          </div>
          <div className="hidden sm:block">
            <NavbarThemeToggle />
          </div>
          <div className="shrink-0">
            <NavbarUserMenu app={app} laundryName={laundryName} settingsHref={settingsHref} />
          </div>
        </div>
      </header>
    </NavbarCommandSearchRoot>
  );
}
