'use client';

import Link from 'next/link';
import {
  AlertCircle,
  CalendarDays,
  LayoutList,
  PackageCheck,
  Printer,
  Store,
  Truck,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { useCallback, useId, useRef, type KeyboardEvent } from 'react';

import { HubChipMotion } from '@/features/partner/orders-hub/partner-hub-motion';
import {
  PARTNER_ORDERS_HUB_CHIP_DEFS,
  PARTNER_ORDERS_PRINT_HREF,
  type PartnerOrdersHubChip,
  type PartnerOrdersHubListChip,
} from '@/features/partner/orders-hub/partner-orders-hub-queue';
import { HORIZONTAL_SCROLL_NATIVE_CLASS } from '@/lib/horizontal-scroll-touch';
import { cn } from '@/lib/utils';

const CHIP_ICONS: Record<PartnerOrdersHubChip, LucideIcon> = {
  needs_action: AlertCircle,
  ready_today: PackageCheck,
  walk_in: Store,
  doorstep: Truck,
  unpaid: Wallet,
  today: CalendarDays,
  all: LayoutList,
  print: Printer,
};

const CHIP_BASE =
  'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium sm:h-9 sm:px-3 sm:text-sm';

type PartnerOrdersShortcutChipsProps = {
  selected: PartnerOrdersHubListChip;
  onSelect: (chip: PartnerOrdersHubListChip) => void;
};

export function PartnerOrdersShortcutChips({
  selected,
  onSelect,
}: PartnerOrdersShortcutChipsProps) {
  const liveId = useId();
  const toolbarRef = useRef<HTMLDivElement>(null);
  const selectedLabel =
    PARTNER_ORDERS_HUB_CHIP_DEFS.find((c) => c.id === selected)?.label ?? 'All';

  const focusChipAt = useCallback((index: number) => {
    const root = toolbarRef.current;
    if (!root) return;
    const focusables = root.querySelectorAll<HTMLElement>(
      '[data-chip-focusable="true"]',
    );
    const el = focusables[index];
    el?.focus();
  }, []);

  const onToolbarKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
      if (!keys.includes(event.key)) return;

      const root = toolbarRef.current;
      if (!root) return;
      const focusables = Array.from(
        root.querySelectorAll<HTMLElement>('[data-chip-focusable="true"]'),
      );
      if (focusables.length === 0) return;

      const current = focusables.indexOf(document.activeElement as HTMLElement);
      let next = current < 0 ? 0 : current;

      if (event.key === 'ArrowRight') next = (current + 1) % focusables.length;
      if (event.key === 'ArrowLeft')
        next = (current - 1 + focusables.length) % focusables.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = focusables.length - 1;

      event.preventDefault();
      focusChipAt(next);
    },
    [focusChipAt],
  );

  return (
    <div
      className={cn('-mx-1 overflow-x-auto px-1', HORIZONTAL_SCROLL_NATIVE_CLASS)}
      data-testid="partner-orders-shortcut-chips"
    >
      <div
        ref={toolbarRef}
        role="toolbar"
        aria-label="Order shortcuts"
        aria-controls={liveId}
        className="flex w-max min-w-full gap-1.5 sm:flex-wrap sm:w-auto"
        onKeyDown={onToolbarKeyDown}
      >
        {PARTNER_ORDERS_HUB_CHIP_DEFS.map((chip) => {
          const Icon = CHIP_ICONS[chip.id];
          if (chip.id === 'print') {
            return (
              <HubChipMotion key={chip.id} selected={false}>
                <Link
                  href={PARTNER_ORDERS_PRINT_HREF}
                  title={chip.description}
                  aria-label={chip.description}
                  data-testid="partner-orders-chip-print"
                  data-chip-focusable="true"
                  className={cn(
                    CHIP_BASE,
                    'border-border/70 bg-background text-foreground transition-colors',
                    'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  )}
                >
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                  {chip.label}
                </Link>
              </HubChipMotion>
            );
          }

          const isSelected = selected === chip.id;
          return (
            <HubChipMotion key={chip.id} selected={isSelected}>
              <button
                type="button"
                title={chip.description}
                aria-pressed={isSelected}
                aria-label={chip.description}
                data-testid={`partner-orders-chip-${chip.id}`}
                data-chip-focusable="true"
                onClick={() => onSelect(chip.id as PartnerOrdersHubListChip)}
                className={cn(
                  CHIP_BASE,
                  'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border/70 bg-background text-foreground hover:bg-muted/50',
                )}
              >
                <Icon
                  className={cn(
                    'h-3.5 w-3.5',
                    isSelected ? 'opacity-90' : 'text-muted-foreground',
                  )}
                  aria-hidden
                />
                {chip.label}
              </button>
            </HubChipMotion>
          );
        })}
      </div>
      <p id={liveId} className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Showing {selectedLabel} orders
      </p>
    </div>
  );
}
