'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useRef, useState } from 'react';

import { useMounted } from '@/lib/hooks/use-mounted';
import { cn } from '@/lib/utils';

const OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const;

type ThemeValue = (typeof OPTIONS)[number]['value'];

function getActiveLabel(theme: string | undefined, resolvedTheme: string | undefined): string {
  if (theme === 'system') return 'System';
  if (theme === 'dark' || resolvedTheme === 'dark') return 'Dark';
  return 'Light';
}

/** Fixed h-7 w-7 footprint — matches the icon-only control before theme state is known. */
function ThemeTogglePlaceholder({ className }: { className?: string }) {
  return (
    <div className={cn('relative shrink-0', className)}>
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-muted/40"
        aria-hidden
      />
    </div>
  );
}

export function NavbarThemeInline({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  return (
    <div
      role="group"
      aria-label="Appearance"
      className={cn('flex flex-col gap-2', className)}
    >
      <p className="text-xs font-medium text-muted-foreground">Appearance</p>
      <div className="grid grid-cols-3 gap-1.5">
        {OPTIONS.map(({ value, label, icon: OptIcon }) => {
          const selected = mounted && theme === value;
          return (
            <button
              key={value}
              type="button"
              className={cn(
                'flex min-h-10 flex-col items-center justify-center gap-1 rounded-lg border px-2 py-2 text-xs font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                selected
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border/60 text-foreground hover:bg-muted',
              )}
              aria-pressed={selected}
              onClick={() => setTheme(value)}
            >
              <OptIcon className="h-4 w-4" aria-hidden />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function NavbarThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const mounted = useMounted();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  if (!mounted) {
    return <ThemeTogglePlaceholder className={className} />;
  }

  const activeLabel = getActiveLabel(theme, resolvedTheme);
  const ResolvedIcon = resolvedTheme === 'dark' ? Moon : Sun;
  const TriggerIcon =
    theme === 'system' ? Monitor : theme === 'dark' ? Moon : theme === 'light' ? Sun : ResolvedIcon;

  return (
    <div ref={ref} className={cn('relative shrink-0', className)}>
      <button
        type="button"
        className={cn(
          'inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors',
          'hover:bg-muted hover:text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'md:w-auto md:gap-1.5 md:px-2.5',
        )}
        aria-label={`Theme, currently ${activeLabel}. Choose light, dark, or system theme`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
      >
        <TriggerIcon className="h-4 w-4 shrink-0" aria-hidden />
        <span className="hidden text-sm font-medium md:inline">Theme</span>
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Theme options"
          className="absolute right-0 top-full z-50 mt-1 w-36 rounded-xl border border-border/60 bg-background p-1 shadow-lg"
        >
          {OPTIONS.map(({ value, label, icon: OptIcon }) => {
            const selected = theme === value;
            return (
              <button
                key={value}
                type="button"
                role="menuitem"
                className={cn(
                  'flex min-h-10 w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-muted',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                  selected && 'bg-primary/10 text-primary',
                )}
                aria-current={selected ? 'true' : undefined}
                onClick={() => {
                  setTheme(value as ThemeValue);
                  setOpen(false);
                }}
              >
                <OptIcon className="h-4 w-4" aria-hidden />
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
