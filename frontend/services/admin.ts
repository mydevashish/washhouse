import { api, type ApiEnvelope } from '@/lib/api';
import type { ListQueryState, PaginatedList } from '@/lib/pagination/types';

export interface PendingLaundry {
  id: string;
  name: string;
  city: string;
  address_line: string;
  owner_email: string | null;
  created_at: string;
}

export interface AdminLaundryRow {
  id: string;
  name: string;
  city: string;
  status: string;
  is_verified: boolean;
}

export interface AdminDashboard {
  orders_total: number;
  users_total: number;
  customers_total: number;
  laundries_approved: number;
  laundries_pending: number;
  revenue_total_inr: string;
  revenue_month_inr: string;
  commission_month_inr: string;
  orders_today: number;
  orders_in_progress: number;
  complaints_open: number;
}

export interface AdminAnalytics {
  orders_trend: Array<{
    date: string;
    orders: number;
    revenue_inr: string;
    new_customers: number;
    new_laundries: number;
  }>;
  top_cities: Array<{ city: string; count: number }>;
  top_laundries: Array<{ name: string; city: string; orders: number; revenue_inr: string }>;
}

export interface AdminLaundryManagementRow {
  id: string;
  name: string;
  owner_name: string;
  owner_email: string | null;
  city: string;
  status: string;
  global_commission_rate: string;
  custom_commission_rate: string | null;
  effective_commission_rate: string;
  orders_count: number;
  revenue_inr: string;
  rating: string;
  review_count: number;
  created_at: string;
}

export interface AdminAuditLogRow {
  id: string;
  timestamp: string;
  user_name: string;
  user_email: string | null;
  role: string | null;
  entity: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
  ip_address: string | null;
  source: string;
  resource_id: string | null;
}

export interface AdminOrderRow {
  id: string;
  tracking_code: string;
  status: string;
  total_inr: string;
  payment_status: string;
  created_at: string;
  laundry_name: string;
  customer_name: string;
}

export interface AdminUserRow {
  id: string;
  email: string | null;
  full_name: string;
  role: string;
  created_at: string;
  is_email_verified: boolean;
}

export interface CreateLaundryInput {
  owner_email: string;
  owner_full_name: string;
  owner_password?: string;
  name: string;
  city: string;
  address_line: string;
  description?: string;
  auto_approve?: boolean;
  services?: Array<{
    name: string;
    category?: string;
    unit?: string;
    price_inr: number;
  }>;
}

export interface CreateLaundryResult {
  laundry_id: string;
  owner_user_id: string;
  owner_email: string;
  status: string;
  services_count: number;
}

export async function listPendingLaundries(): Promise<PendingLaundry[]> {
  const { data } = await api.get<ApiEnvelope<PendingLaundry[]>>('/admin/laundries/pending');
  return data.data;
}

export async function listAllLaundries(): Promise<AdminLaundryRow[]> {
  const { data } = await api.get<ApiEnvelope<AdminLaundryRow[]>>('/admin/laundries');
  return data.data;
}

export async function listAdminOrders(params: ListQueryState = {}): Promise<PaginatedList<AdminOrderRow>> {
  const { data } = await api.get<ApiEnvelope<PaginatedList<AdminOrderRow>>>('/admin/orders', { params });
  return data.data;
}

export async function listAdminUsers(params: ListQueryState = {}): Promise<PaginatedList<AdminUserRow>> {
  const { data } = await api.get<ApiEnvelope<PaginatedList<AdminUserRow>>>('/admin/users', { params });
  return data.data;
}

export async function createLaundry(input: CreateLaundryInput): Promise<CreateLaundryResult> {
  const { data } = await api.post<ApiEnvelope<CreateLaundryResult>>('/admin/laundries', input);
  return data.data;
}

export async function approveLaundry(id: string): Promise<{ id: string; status: string }> {
  const { data } = await api.post<ApiEnvelope<{ id: string; status: string }>>(
    `/admin/laundries/${id}/approve`,
    {},
  );
  return data.data;
}

export async function rejectLaundry(id: string): Promise<{ id: string; status: string }> {
  const { data } = await api.post<ApiEnvelope<{ id: string; status: string }>>(
    `/admin/laundries/${id}/reject`,
    {},
  );
  return data.data;
}

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const { data } = await api.get<ApiEnvelope<AdminDashboard>>('/admin/dashboard');
  return data.data;
}

export async function getDefaultCommission(): Promise<{ rate: string }> {
  const { data } = await api.get<ApiEnvelope<{ rate: string }>>('/admin/commission/default');
  return data.data;
}

export async function setDefaultCommission(rate: number): Promise<{ rate: string }> {
  const { data } = await api.put<ApiEnvelope<{ rate: string }>>('/admin/commission/default', {
    rate,
  });
  return data.data;
}

export async function setLaundryCommission(
  laundryId: string,
  rate: number | null,
): Promise<{ id: string; commission_rate: string | null }> {
  const { data } = await api.patch<ApiEnvelope<{ id: string; commission_rate: string | null }>>(
    `/admin/laundries/${laundryId}/commission`,
    { rate },
  );
  return data.data;
}

export async function getAdminAnalytics(days = 14): Promise<AdminAnalytics> {
  const { data } = await api.get<ApiEnvelope<AdminAnalytics>>('/admin/analytics', {
    params: { days },
  });
  return data.data;
}

export async function listLaundriesManagement(): Promise<AdminLaundryManagementRow[]> {
  const { data } = await api.get<ApiEnvelope<AdminLaundryManagementRow[]>>(
    '/admin/laundries/management',
  );
  return data.data;
}

export interface AdminAuditListParams extends ListQueryState {
  resource_type?: string;
  resource_id?: string;
  action?: string;
  created_from?: string;
  created_to?: string;
}

export async function listAdminAuditLogs(params: AdminAuditListParams = {}): Promise<PaginatedList<AdminAuditLogRow>> {
  const { data } = await api.get<ApiEnvelope<PaginatedList<AdminAuditLogRow>>>('/admin/audit-logs', { params });
  return data.data;
}
