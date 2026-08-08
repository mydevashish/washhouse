'use client';

import Image from 'next/image';
import {
  Activity,
  KeyRound,
  Pencil,
  UserMinus,
  UserPlus,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  isStaffOnShift,
  staffInitials,
  staffRoleVisual,
  staffStatus,
} from '@/features/partner/lib/owner-staff';
import { cn } from '@/lib/utils';
import { formatWorkSchedule, type StaffMember } from '@/services/staff-management';

export function OwnerStaffCard({
  member,
  busy,
  onEdit,
  onActivity,
  onResetPassword,
  onSuspend,
  onUnsuspend,
  onDeactivate,
  onActivate,
}: {
  member: StaffMember;
  busy?: boolean;
  onEdit: () => void;
  onActivity: () => void;
  onResetPassword: () => void;
  onSuspend: () => void;
  onUnsuspend: () => void;
  onDeactivate: () => void;
  onActivate: () => void;
}) {
  const visual = staffRoleVisual(String(member.role));
  const status = staffStatus(member);
  const onShift = member.is_active && !member.is_suspended && isStaffOnShift(member.work_schedule);

  return (
    <article
      className="flex flex-col overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm"
      data-testid="owner-staff-card"
    >
      <div className="relative h-28 w-full bg-muted">
        <Image
          src={visual.imageSrc}
          alt={visual.imageAlt}
          fill
          sizes="(max-width: 640px) 100vw, 33vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full bg-background/90 text-xs font-semibold ring-1 ring-border/60"
            aria-hidden
          >
            {staffInitials(member.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground drop-shadow-sm">{member.name}</p>
            <p className="text-[11px] text-muted-foreground">{visual.label}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              'inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium',
              status.className,
            )}
            title={status.description}
          >
            <span className="sr-only">{status.description}: </span>
            {status.label}
          </span>
          {onShift ? (
            <span className="inline-flex items-center rounded-md bg-info-muted px-1.5 py-0.5 text-[11px] font-medium text-info ring-1 ring-info/30">
              On shift
            </span>
          ) : null}
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">{visual.blurb}</p>
        <p className="text-xs text-muted-foreground">
          {member.phone || member.email || 'No contact on file'}
        </p>
        <p className="text-[11px] text-muted-foreground">{formatWorkSchedule(member.work_schedule)}</p>

        <div className="mt-auto flex flex-wrap gap-2" role="group" aria-label={`Actions for ${member.name}`}>
          <Button type="button" variant="outline" size="sm" className="min-h-[44px] gap-1.5" onClick={onEdit} disabled={busy}>
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            Edit
          </Button>
          <Button type="button" variant="outline" size="sm" className="min-h-[44px] gap-1.5" onClick={onActivity} disabled={busy}>
            <Activity className="h-3.5 w-3.5" aria-hidden />
            Activity
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-[44px] gap-1.5"
            onClick={onResetPassword}
            disabled={busy}
          >
            <KeyRound className="h-3.5 w-3.5" aria-hidden />
            Reset pwd
          </Button>
          {member.is_suspended ? (
            <Button type="button" variant="secondary" size="sm" className="min-h-[44px]" onClick={onUnsuspend} disabled={busy}>
              Unsuspend
            </Button>
          ) : member.is_active ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-[44px] gap-1.5"
              onClick={onSuspend}
              disabled={busy}
            >
              <UserMinus className="h-3.5 w-3.5" aria-hidden />
              Suspend
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="min-h-[44px] gap-1.5"
              onClick={onActivate}
              disabled={busy}
            >
              <UserPlus className="h-3.5 w-3.5" aria-hidden />
              Activate
            </Button>
          )}
          {member.is_active && !member.is_suspended ? (
            <Button type="button" variant="ghost" size="sm" className="min-h-[44px]" onClick={onDeactivate} disabled={busy}>
              Deactivate
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
