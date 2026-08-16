'use client';

import Image from 'next/image';
import { Check, CircleAlert } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  staffCoverage,
  staffHref,
  staffInitials,
  type StaffCapability,
} from '@/features/partner/lib/owner-staff';
import { cn } from '@/lib/utils';
import type { StaffMember } from '@/services/staff-management';

function CoverageColumn({
  title,
  capability,
  members,
}: {
  title: string;
  capability: StaffCapability;
  members: StaffMember[];
}) {
  const { ready, gap } = staffCoverage(members, capability);

  return (
    <div
      className={cn(
        'rounded-xl border px-4 py-3',
        gap ? 'border-warning/40 bg-warning-muted/30' : 'border-border/60 bg-card',
      )}
      data-testid={`owner-staff-coverage-${capability}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {gap ? 'No one ready — add or unsuspend staff' : `${ready.length} ready to assign`}
          </p>
        </div>
        {gap ? (
          <CircleAlert className="h-4 w-4 shrink-0 text-warning" aria-hidden />
        ) : (
          <Check className="h-4 w-4 shrink-0 text-success" aria-hidden />
        )}
      </div>

      {ready.length > 0 ? (
        <ul className="mt-3 space-y-1.5" aria-label={`${title} checklist`}>
          {ready.slice(0, 6).map((m) => (
            <li key={m.id} className="flex items-center gap-2 text-sm">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold"
                aria-hidden
              >
                {staffInitials(m.name)}
              </span>
              <span className="min-w-0 truncate font-medium">{m.name}</span>
              <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">{m.role_label}</span>
            </li>
          ))}
          {ready.length > 6 ? (
            <li className="text-xs text-muted-foreground">+{ready.length - 6} more</li>
          ) : null}
        </ul>
      ) : (
        <Button asChild variant="outline" size="sm" className="mt-3 h-9 min-h-9">
          <Link href={staffHref({ capability, action: 'add' })}>Add {capability} helper</Link>
        </Button>
      )}
    </div>
  );
}

export function OwnerStaffCoverage({ members }: { members: StaffMember[] }) {
  return (
    <section aria-label="Coverage today" className="space-y-3" data-testid="owner-staff-coverage">
      <div>
        <h2 className="text-sm font-semibold text-foreground sm:text-base">Coverage today</h2>
        <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
          Who can run pickups and deliveries from Logistics assign.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <CoverageColumn title="Who can run pickups?" capability="pickup" members={members} />
        <CoverageColumn title="Who can deliver?" capability="delivery" members={members} />
      </div>
    </section>
  );
}
