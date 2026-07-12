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

export function NavbarThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const mounted = useMounted();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const Icon = resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Theme"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
      >
        {mounted ? <Icon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 w-36 rounded-xl border border-border/60 bg-background p-1 shadow-lg"
        >
          {OPTIONS.map(({ value, label, icon: OptIcon }) => (
            <button
              key={value}
              type="button"
              role="menuitem"
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-muted',
                theme === value && 'bg-primary/10 text-primary',
              )}
              onClick={() => {
                setTheme(value);
                setOpen(false);
              }}
            >
              <OptIcon className="h-4 w-4" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
