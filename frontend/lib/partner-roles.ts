import type { UserRole } from '@/types/user';

/** Roles allowed to access the partner portal shell and APIs. */
export const PARTNER_PORTAL_ROLES: UserRole[] = [
  'partner',
  'partner_staff',
  'admin',
  'super_admin',
];
