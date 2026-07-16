'use client';

import Link from 'next/link';
import { HelpCircle, LogOut, Settings, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { NavbarThemeToggle } from '@/components/layout/global-navbar/navbar-theme-toggle';
import { Button } from '@/components/ui/button';
import type { AppContext } from '@/lib/navigation/types';
import { useMounted } from '@/lib/hooks/use-mounted';
import { performSessionLogout } from '@/lib/session-logout';
import { useAuthStore } from '@/store/auth.store';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function AccountMenuPlaceholder() {
  return (
    <span
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/40"
      aria-hidden
    />
  );
}

export function NavbarUserMenu({
  app,
  laundryName,
  settingsHref,
}: {
  app: AppContext;
  laundryName?: string;
  settingsHref: string;
}) {
  const mounted = useMounted();
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  async function handleLogout() {
    setOpen(false);
    await performSessionLogout({ reason: 'manual' });
  }

  if (!user) {
    return (
      <Button asChild size="sm" className="h-7 px-2 text-xs">
        <Link href="/login">Sign in</Link>
      </Button>
    );
  }

  if (!mounted) {
    return <AccountMenuPlaceholder />;
  }

  const roleLabel =
    user.role === 'partner'
      ? 'Partner'
      : user.role === 'admin' || user.role === 'super_admin'
        ? 'Admin'
        : 'Customer';

  const displayName = user.full_name || user.email || 'User';
  const firstName = displayName.split(' ')[0] ?? displayName;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="flex h-7 items-center gap-1 rounded-md pl-0.5 pr-1.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-[10px] font-bold text-primary-foreground">
          {initials(displayName)}
        </span>
        <span className="hidden max-w-[6rem] truncate text-xs font-medium lg:inline">{firstName}</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 w-64 rounded-xl border border-border/60 bg-background py-1 shadow-lg"
        >
          <div className="border-b border-border/60 px-3 py-2.5">
            <p className="truncate text-sm font-semibold">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            <p className="mt-1 text-xs text-muted-foreground">{roleLabel}</p>
            {app === 'partner' && laundryName && (
              <p className="mt-0.5 truncate text-xs font-medium text-primary">{laundryName}</p>
            )}
          </div>
          <div className="p-1">
            <Link
              href="/account"
              role="menuitem"
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              <User className="h-4 w-4 text-muted-foreground" />
              Profile
            </Link>
            <Link
              href={settingsHref}
              role="menuitem"
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
              {app === 'customer' ? 'Account settings' : 'Settings'}
            </Link>
            <Link
              href="/discover"
              role="menuitem"
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
              Help center
            </Link>
          </div>
          <div className="border-t border-border/60 px-3 py-2 sm:hidden">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Theme</p>
            <NavbarThemeToggle />
          </div>
          <div className="border-t border-border/60 p-1">
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-destructive hover:bg-destructive/10"
              onClick={() => void handleLogout()}
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
