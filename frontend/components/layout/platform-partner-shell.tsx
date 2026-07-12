'use client';

import Link from 'next/link';
import { BarChart3, LogOut } from 'lucide-react';

import { SkipToContent } from '@/components/accessibility/skip-to-content';
import { AnnouncementBannerStack } from '@/components/announcements/announcement-banner';
import { Button } from '@/components/ui/button';
import { useMounted } from '@/lib/hooks/use-mounted';
import { performSessionLogout } from '@/lib/session-logout';
import { useAuthStore } from '@/store/auth.store';

export function PlatformPartnerShell({ children }: { children: React.ReactNode }) {
  const mounted = useMounted();
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <SkipToContent />
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-primary" aria-hidden />
            <div>
              <p className="text-sm font-semibold">DLM Platform Partner</p>
              <p className="text-[10px] text-muted-foreground">Read-only dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {mounted && user && (
              <span className="hidden text-xs text-muted-foreground sm:inline">{user.full_name}</span>
            )}
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => void performSessionLogout({ reason: 'manual' })}
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden />
              Sign out
            </Button>
          </div>
        </div>
        {mounted && user && <AnnouncementBannerStack />}
      </header>
      <main id="main-content" className="mx-auto w-full max-w-screen-xl flex-1 px-4 py-6 focus:outline-none" tabIndex={-1}>
        {children}
      </main>
      <footer className="border-t border-border/60 py-4 text-center text-[10px] text-muted-foreground">
        <Link href="/platform-partner" className="hover:underline">Dashboard</Link>
        {' · '}
        <Link href="/platform-partner/earnings" className="hover:underline">My earnings</Link>
        {' · '}
        View-only · No payout calculations
      </footer>
    </div>
  );
}
