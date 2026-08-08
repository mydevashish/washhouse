'use client';

import Link from 'next/link';
import {
  BarChart3,
  Bell,
  IndianRupee,
  LayoutDashboard,
  Package,
  Settings,
  Wallet,
} from 'lucide-react';

import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { PartnerPanel } from '@/features/partner/components/partner-panel';
import { PartnerPracticeModeToggle } from '@/features/partner-shop-floor/components/partner-practice-mode-toggle';
import { PartnerFloorVoiceToggle } from '@/features/partner-shop-floor/components/partner-floor-voice-toggle';
import { PartnerUiModeToggle } from '@/features/partner-shop-floor/components/partner-ui-mode-toggle';
import { usePartnerUiMode } from '@/features/partner-shop-floor/hooks/use-partner-ui-mode';
import { cn } from '@/lib/utils';

const MORE_LINKS = [
  { href: '/partner/settings', label: 'Settings', english: 'Shop preferences', icon: Settings },
  { href: '/partner/pricing', label: 'Garment prices', english: 'Rate list', icon: IndianRupee },
  { href: '/partner/revenue', label: 'Pricing & revenue', english: 'Money view', icon: Wallet },
  { href: '/partner/reports', label: 'Reports', english: 'Charts & exports', icon: BarChart3 },
  { href: '/partner/orders', label: 'Orders Hub', english: 'Desk & requests', icon: Package },
  { href: '/partner/notifications', label: 'Notifications', english: 'Alerts', icon: Bell },
] as const;

export function ShopFloorMoreView() {
  const { setMode } = usePartnerUiMode();

  return (
    <PartnerContent className="space-y-5">
      <PartnerPageHeader
        title="More"
        description="Settings, pricing, revenue — aur Advanced Mode."
      />

      <PartnerPanel title="Display mode" bodyClassName="px-4 py-4">
        <PartnerUiModeToggle />
      </PartnerPanel>

      <PartnerPanel title="Practice / training" bodyClassName="px-4 py-4">
        <PartnerPracticeModeToggle />
      </PartnerPanel>

      <PartnerPanel title="Voice / sound" bodyClassName="px-4 py-4">
        <PartnerFloorVoiceToggle />
      </PartnerPanel>

      <PartnerPanel title="Owner tools" bodyClassName="px-2 py-2">
        <ul className="flex flex-col gap-1">
          {MORE_LINKS.map(({ href, label, english, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  'flex min-h-16 items-center gap-3 rounded-xl px-3 py-2 transition-colors',
                  'text-foreground hover:bg-muted/70',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                )}
              >
                <Icon className="h-6 w-6 shrink-0 text-primary" aria-hidden />
                <span className="flex min-w-0 flex-col">
                  <span className="text-base font-semibold">{label}</span>
                  <span className="text-xs text-muted-foreground">{english}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </PartnerPanel>

      <button
        type="button"
        className={cn(
          'flex min-h-16 w-full items-center gap-3 rounded-xl border-2 border-border px-4 py-3 text-left',
          'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
        onClick={() => setMode('advanced')}
      >
        <LayoutDashboard className="h-6 w-6 shrink-0 text-primary" aria-hidden />
        <span className="flex min-w-0 flex-col">
          <span className="text-base font-semibold">Open Advanced Mode</span>
          <span className="text-xs text-muted-foreground">
            Full sidebar — Overview, Orders Hub, settlements
          </span>
        </span>
      </button>
    </PartnerContent>
  );
}
