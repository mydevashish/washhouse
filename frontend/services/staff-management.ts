import { api, type ApiEnvelope } from '@/lib/api';



export type StaffRole =

  | 'owner'

  | 'manager'

  | 'pickup_agent'

  | 'delivery_agent'

  | 'operator'

  | 'support_staff';



export interface WorkSchedule {

  days: string[];

  start_time: string;

  end_time: string;

  timezone: string;

}



export const DEFAULT_WORK_SCHEDULE: WorkSchedule = {

  days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],

  start_time: '09:00',

  end_time: '18:00',

  timezone: 'Asia/Kolkata',

};



export interface StaffDashboard {

  laundry_id: string;

  laundry_name: string;

  total_staff: number;

  active_staff: number;

  online_staff: number;

  inactive_staff: number;

  suspended_staff: number;

  pending_tasks: number;

  pending_pickups: number;

  pending_deliveries: number;

  pending_processing: number;

}



export interface StaffMember {

  id: string;

  laundry_id: string;

  laundry_name: string;

  user_id: string | null;

  name: string;

  email: string | null;

  phone: string | null;

  role: StaffRole | string;

  role_label: string;

  is_active: boolean;

  is_suspended: boolean;

  suspended_reason: string | null;

  work_schedule: WorkSchedule | null;

  last_login_at: string | null;

  last_active_at: string | null;

  created_at: string;

  temporary_password?: string | null;

}



export interface StaffActivityRow {

  id: string;

  staff_id: string | null;

  staff_name: string;

  action: string;

  resource_type: string | null;

  resource_id: string | null;

  description: string | null;

  metadata: Record<string, unknown>;

  created_at: string;

}



export interface CreateStaffInput {

  name: string;

  email: string;

  phone?: string;

  role: StaffRole;

  password?: string;

  work_schedule?: WorkSchedule;

}



export interface UpdateStaffInput {

  name?: string;

  phone?: string;

  role?: StaffRole;

  work_schedule?: WorkSchedule;

}



export const STAFF_ROLE_LABELS: Record<string, string> = {

  owner: 'Owner',

  manager: 'Manager',

  pickup_agent: 'Pickup Agent',

  delivery_agent: 'Delivery Agent',

  operator: 'Laundry Operator',

  support_staff: 'Support Staff',

};



export const STAFF_ROLES: StaffRole[] = [

  'manager',

  'pickup_agent',

  'delivery_agent',

  'operator',

  'support_staff',

];



export const WEEKDAYS = [

  { id: 'mon', label: 'Mon' },

  { id: 'tue', label: 'Tue' },

  { id: 'wed', label: 'Wed' },

  { id: 'thu', label: 'Thu' },

  { id: 'fri', label: 'Fri' },

  { id: 'sat', label: 'Sat' },

  { id: 'sun', label: 'Sun' },

];



export async function getStaffDashboard(): Promise<StaffDashboard> {

  const { data } = await api.get<ApiEnvelope<StaffDashboard>>('/partner/staff-management/dashboard');

  return data.data;

}



export async function listStaffMembers(): Promise<StaffMember[]> {

  const { data } = await api.get<ApiEnvelope<StaffMember[]>>('/partner/staff-management');

  return data.data;

}



export async function createStaffMember(body: CreateStaffInput): Promise<StaffMember> {

  const { data } = await api.post<ApiEnvelope<StaffMember>>('/partner/staff-management', body);

  return data.data;

}



export async function updateStaffMember(id: string, body: UpdateStaffInput): Promise<StaffMember> {

  const { data } = await api.patch<ApiEnvelope<StaffMember>>(`/partner/staff-management/${id}`, body);

  return data.data;

}



export async function deactivateStaffMember(id: string): Promise<StaffMember> {

  const { data } = await api.post<ApiEnvelope<StaffMember>>(`/partner/staff-management/${id}/deactivate`);

  return data.data;

}



export async function activateStaffMember(id: string): Promise<StaffMember> {

  const { data } = await api.post<ApiEnvelope<StaffMember>>(`/partner/staff-management/${id}/activate`);

  return data.data;

}



export async function suspendStaffMember(id: string, reason: string): Promise<StaffMember> {

  const { data } = await api.post<ApiEnvelope<StaffMember>>(`/partner/staff-management/${id}/suspend`, { reason });

  return data.data;

}



export async function unsuspendStaffMember(id: string): Promise<StaffMember> {

  const { data } = await api.post<ApiEnvelope<StaffMember>>(`/partner/staff-management/${id}/unsuspend`);

  return data.data;

}



export async function resetStaffPassword(id: string): Promise<{ staff_id: string; temporary_password: string }> {

  const { data } = await api.post<ApiEnvelope<{ staff_id: string; temporary_password: string }>>(

    `/partner/staff-management/${id}/reset-password`,

  );

  return data.data;

}



export async function getStaffActivity(staffId?: string): Promise<StaffActivityRow[]> {

  const { data } = await api.get<ApiEnvelope<StaffActivityRow[]>>('/partner/staff-management/activity', {

    params: staffId ? { staff_id: staffId } : undefined,

  });

  return data.data;

}



export const ACTIVITY_LABELS: Record<string, string> = {

  login: 'Login',

  logout: 'Logout',

  order_update: 'Order update',

  assignment: 'Assignment',

  status_change: 'Status change',

  staff_created: 'Staff created',

  staff_updated: 'Staff updated',

  staff_deactivated: 'Staff deactivated',

  staff_suspended: 'Suspended',

  staff_unsuspended: 'Unsuspended',

  password_reset: 'Password reset',

};



export function formatWorkSchedule(schedule: WorkSchedule | null | undefined): string {

  if (!schedule) return '—';

  const dayLabels = schedule.days.map((d) => WEEKDAYS.find((w) => w.id === d)?.label ?? d).join(', ');

  return `${dayLabels} · ${schedule.start_time}–${schedule.end_time}`;

}

