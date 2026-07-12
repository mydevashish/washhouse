export type UserRole = 'customer' | 'partner' | 'partner_staff' | 'admin' | 'super_admin' | 'platform_partner';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_email_verified: boolean;
  created_at: string;
  updated_at: string;
}
