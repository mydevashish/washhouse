'use client';

import { useEffect, useState } from 'react';
import { LogOut, Timer } from 'lucide-react';

import { IdleAnimationCanvas } from '@/components/session/idle-animation-canvas';
import { Button } from '@/components/ui/button';
import { publishSessionSync } from '@/lib/idle/tab-sync';

function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

type IdleWarningOverlayProps = {
  isAuthenticated: boolean;
  warningEndsAt: number;
  onContinue: () => void;
  onLogout?: () => void;
};

export function IdleWarningOverlay({
  isAuthenticated,
  warningEndsAt,
  onContinue,
  onLogout,
}: IdleWarningOverlayProps) {
  const [remaining, setRemaining] = useState(() => Math.max(0, warningEndsAt - Date.now()));

  useEffect(() => {
    const id = window.setInterval(() => {
      setRemaining(Math.max(0, warningEndsAt - Date.now()));
    }, 250);
    return () => clearInterval(id);
  }, [warningEndsAt]);

  const handleContinue = () => {
    publishSessionSync({ type: 'continue' });
    onContinue();
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="idle-warning-title"
      aria-describedby="idle-warning-desc"
    >
      <IdleAnimationCanvas className="pointer-events-none absolute inset-0 h-full w-full opacity-70" />

      <div className="relative z-10 mx-4 w-full max-w-md rounded-xl border border-border bg-card/95 p-6 shadow-modal ring-1 ring-border/60 sm:p-8">
        <div className="flex items-center gap-2 text-warning">
          <Timer className="h-5 w-5 shrink-0" aria-hidden />
          <p className="text-xs font-semibold uppercase tracking-wider">
            {isAuthenticated ? 'Session idle' : 'Taking a break?'}
          </p>
        </div>

        <h2 id="idle-warning-title" className="page-title mt-3">
          {isAuthenticated ? 'You have been inactive' : 'Still browsing?'}
        </h2>
        <p id="idle-warning-desc" className="mt-2 text-sm text-muted-foreground">
          {isAuthenticated
            ? 'Move your mouse or press Continue to stay signed in. Otherwise you will be signed out automatically.'
            : 'Move your mouse or tap Continue to return. Your page will stay right where you left it.'}
        </p>

        {isAuthenticated && (
          <>
            <p
              className="mt-6 text-center font-mono text-4xl font-semibold tabular-nums tracking-tight text-foreground"
              aria-live="polite"
              aria-atomic="true"
            >
              {formatCountdown(remaining)}
            </p>
            <p className="mt-1 text-center text-xs text-muted-foreground">Session expires in</p>
          </>
        )}

        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button type="button" size="lg" className="min-h-[44px] flex-1 sm:flex-none" onClick={handleContinue}>
            {isAuthenticated ? 'Continue session' : 'Continue browsing'}
          </Button>
          {isAuthenticated && onLogout && (
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="min-h-[44px] flex-1 sm:flex-none"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Logout
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
