import { OWNER_IMAGES } from '@/features/partner/components/owner/owner-assets';
import type { StaffMember, StaffRole, WorkSchedule } from '@/services/staff-management';
import { STAFF_ROLE_LABELS } from '@/services/staff-management';

/** Matches logistics assign eligibility (P4). */
export const STAFF_PICKUP_ROLES = new Set([
  'pickup_agent',
  'pickup_only',
  'owner',
  'manager',
  'full_access',
]);

export const STAFF_DELIVERY_ROLES = new Set([
  'delivery_agent',
  'delivery_only',
  'owner',
  'manager',
  'full_access',
]);

export type StaffCapability = 'pickup' | 'delivery';

export type StaffRoleFamily = 'pickup' | 'delivery' | 'inventory' | 'full' | 'support';

export type StaffStatusKind = 'active' | 'suspended' | 'offline';

export type StaffStatusMeta = {
  id: StaffStatusKind;
  label: string;
  description: string;
  className: string;
};

export type StaffRoleVisual = {
  family: StaffRoleFamily;
  label: string;
  blurb: string;
  imageSrc: string;
  imageAlt: string;
};

const STATUS: Record<StaffStatusKind, StaffStatusMeta> = {
  active: {
    id: 'active',
    label: 'Active',
    description: 'Active staff',
    className: 'bg-success-muted text-success ring-1 ring-success/30',
  },
  suspended: {
    id: 'suspended',
    label: 'Suspended',
    description: 'Suspended staff',
    className: 'bg-warning-muted text-warning ring-1 ring-warning/30',
  },
  offline: {
    id: 'offline',
    label: 'Offline',
    description: 'Offline / inactive staff',
    className: 'bg-muted text-muted-foreground ring-1 ring-border/60',
  },
};

/** Roles owners can assign when creating/editing (excludes owner). */
export const ASSIGNABLE_STAFF_ROLES: StaffRole[] = [
  'manager',
  'pickup_agent',
  'delivery_agent',
  'operator',
  'support_staff',
];

export function staffRoleFamily(role: string): StaffRoleFamily {
  if (role === 'pickup_agent' || role === 'pickup_only') return 'pickup';
  if (role === 'delivery_agent' || role === 'delivery_only') return 'delivery';
  if (role === 'operator' || role === 'inventory') return 'inventory';
  if (role === 'manager' || role === 'owner' || role === 'full_access') return 'full';
  return 'support';
}

export function staffRoleVisual(role: string): StaffRoleVisual {
  const family = staffRoleFamily(role);
  const label = STAFF_ROLE_LABELS[role] ?? role;
  switch (family) {
    case 'pickup':
      return {
        family,
        label,
        blurb: 'Collects bags from customers and brings them to the shop.',
        imageSrc: OWNER_IMAGES.logistics,
        imageAlt: 'Pickup run',
      };
    case 'delivery':
      return {
        family,
        label,
        blurb: 'Takes finished laundry back to the customer.',
        imageSrc: OWNER_IMAGES.emptyLogistics,
        imageAlt: 'Delivery run',
      };
    case 'inventory':
      return {
        family,
        label,
        blurb: 'Runs wash, iron, and floor boards inside the shop.',
        imageSrc: OWNER_IMAGES.shop,
        imageAlt: 'Shop floor work',
      };
    case 'full':
      return {
        family,
        label,
        blurb: 'Full access — can manage orders, staff tasks, and runs.',
        imageSrc: OWNER_IMAGES.people,
        imageAlt: 'Manager coverage',
      };
    default:
      return {
        family,
        label,
        blurb: 'Helps with front desk and customer support.',
        imageSrc: OWNER_IMAGES.calm,
        imageAlt: 'Support staff',
      };
  }
}

export function staffStatus(member: Pick<StaffMember, 'is_active' | 'is_suspended'>): StaffStatusMeta {
  if (member.is_suspended) return STATUS.suspended;
  if (!member.is_active) return STATUS.offline;
  return STATUS.active;
}

export function canRunCapability(role: string, capability: StaffCapability): boolean {
  return capability === 'pickup' ? STAFF_PICKUP_ROLES.has(role) : STAFF_DELIVERY_ROLES.has(role);
}

/** Available for assign: active, not suspended, and role-eligible. */
export function isAssignableForCapability(
  member: Pick<StaffMember, 'role' | 'is_active' | 'is_suspended'>,
  capability: StaffCapability,
): boolean {
  return member.is_active && !member.is_suspended && canRunCapability(String(member.role), capability);
}

export function staffCoverage(
  members: StaffMember[],
  capability: StaffCapability,
): { ready: StaffMember[]; gap: boolean } {
  const ready = members.filter((m) => isAssignableForCapability(m, capability));
  return { ready, gap: ready.length === 0 };
}

/**
 * Local on-shift check from work_schedule (Asia/Kolkata wall clock).
 * Missing schedule → treat as on-shift when otherwise active (owner hasn't set hours yet).
 */
export function isStaffOnShift(
  schedule: WorkSchedule | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!schedule?.days?.length) return true;
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: schedule.timezone || 'Asia/Kolkata',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const weekday = parts.find((p) => p.type === 'weekday')?.value?.toLowerCase() ?? '';
  const hour = parts.find((p) => p.type === 'hour')?.value ?? '00';
  const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
  const dayMap: Record<string, string> = {
    mon: 'mon',
    tue: 'tue',
    wed: 'wed',
    thu: 'thu',
    fri: 'fri',
    sat: 'sat',
    sun: 'sun',
  };
  // en-GB short: Mon, Tue…
  const dayId = dayMap[weekday.slice(0, 3)] ?? weekday.slice(0, 3);
  if (!schedule.days.includes(dayId)) return false;
  const nowMins = Number(hour) * 60 + Number(minute);
  const [sh, sm] = schedule.start_time.split(':').map(Number);
  const [eh, em] = schedule.end_time.split(':').map(Number);
  const startMins = (sh ?? 0) * 60 + (sm ?? 0);
  const endMins = (eh ?? 23) * 60 + (em ?? 59);
  if (endMins >= startMins) return nowMins >= startMins && nowMins <= endMins;
  // overnight shift
  return nowMins >= startMins || nowMins <= endMins;
}

export function parseStaffCapability(value: string | null | undefined): StaffCapability | null {
  if (value === 'pickup' || value === 'delivery') return value;
  return null;
}

export function staffHref(opts?: { capability?: StaffCapability; action?: 'add' }): string {
  const params = new URLSearchParams();
  if (opts?.capability) params.set('capability', opts.capability);
  if (opts?.action) params.set('action', opts.action);
  const qs = params.toString();
  return qs ? `/partner/staff?${qs}` : '/partner/staff';
}

export function filterStaffByCapability(
  members: StaffMember[],
  capability: StaffCapability | null,
): StaffMember[] {
  if (!capability) return members;
  return members.filter((m) => canRunCapability(String(m.role), capability));
}

export function staffInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
}
