'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import type { AppContext } from '@/lib/navigation/types';
import type { UserRole } from '@/types/user';

type QuickAction = { label: string; href: string; roles: UserRole[] };

const ACTIONS: QuickAction[] = [
  { label: 'Create laundry', href: '/admin/laundries', roles: ['admin', 'super_admin'] },
  { label: 'Review approvals', href: '/admin/approvals', roles: ['admin', 'super_admin'] },
  { label: 'View orders', href: '/partner/orders', roles: ['partner', 'admin', 'super_admin'] },
  { label: 'Edit storefront', href: '/partner/storefront', roles: ['partner'] },
  { label: 'Discover laundries', href: '/discover', roles: ['customer', 'partner', 'admin', 'super_admin'] },
];

export function NavbarQuickActions({
  app,
  role,
}: {
  app: AppContext;
  role?: UserRole;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const visible = ACTIONS.filter((a) => {
    if (!role) return app === 'customer';
    return a.roles.includes(role);
  }).slice(0, 5);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  if (visible.length === 0) return null;

  return (
    <div ref={ref} className="relative hidden sm:block">
      <Button
        type="button"
        size="sm"
        className="h-7 gap-0.5 px-2 text-xs"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
        <span className="hidden lg:inline">Quick actions</span>
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 min-w-[12rem] rounded-xl border border-border/60 bg-background p-1 shadow-lg"
        >
          {visible.map((action) => (
            <Link
              key={action.href + action.label}
              href={action.href}
              role="menuitem"
              className="block rounded-lg px-3 py-2 text-sm hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              {action.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
