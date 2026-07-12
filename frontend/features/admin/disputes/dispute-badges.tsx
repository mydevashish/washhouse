'use client';

import { cn } from '@/lib/utils';

const TYPE_STYLES: Record<string, string> = {
  missing_item: 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
  missing_items: 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
  damaged_item: 'bg-red-500/10 text-red-700 dark:text-red-300',
  damaged_items: 'bg-red-500/10 text-red-700 dark:text-red-300',
  wrong_item: 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
  late_delivery: 'bg-amber-500/10 text-amber-800 dark:text-amber-300',
  delayed_delivery: 'bg-amber-500/10 text-amber-800 dark:text-amber-300',
  quality_issue: 'bg-yellow-500/10 text-yellow-800 dark:text-yellow-300',
  refund_request: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  payment_issue: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
  other: 'bg-muted text-muted-foreground',
};

const PRIORITY_STYLES: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-primary/10 text-primary',
  high: 'bg-warning-muted text-warning',
  critical: 'bg-destructive/10 text-destructive',
};

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-warning-muted text-warning',
  investigating: 'bg-primary/10 text-primary',
  awaiting_customer: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  awaiting_partner: 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
  resolved: 'bg-success-muted text-success',
  rejected: 'bg-danger-muted text-danger',
  escalated: 'bg-destructive/10 text-destructive',
  closed: 'bg-muted text-muted-foreground',
};

const SLA_STYLES: Record<string, string> = {
  on_track: 'bg-success-muted text-success',
  at_risk: 'bg-warning-muted text-warning',
  breached: 'bg-destructive/10 text-destructive',
  met: 'bg-success-muted text-success',
  missed: 'bg-destructive/10 text-destructive',
  na: 'bg-muted text-muted-foreground',
};

export function DisputeTypeBadge({ label, type }: { label: string; type?: string }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap',
        TYPE_STYLES[type ?? ''] ?? 'bg-muted text-muted-foreground',
      )}
    >
      {label}
    </span>
  );
}

export function DisputePriorityBadge({ label, priority }: { label: string; priority: string }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold',
        PRIORITY_STYLES[priority] ?? 'bg-muted text-muted-foreground',
      )}
    >
      {label}
    </span>
  );
}

export function DisputeStatusBadge({ label, status }: { label: string; status: string }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap',
        STATUS_STYLES[status] ?? 'bg-muted text-muted-foreground',
      )}
    >
      {label}
    </span>
  );
}

export function DisputeSlaBadge({ label, status }: { label: string; status: string }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap',
        SLA_STYLES[status] ?? 'bg-muted text-muted-foreground',
      )}
    >
      {label}
    </span>
  );
}
