import { api, type ApiEnvelope } from '@/lib/api';
import type { PaginatedList } from '@/lib/pagination/types';

export type SettlementStatus =
  | 'pending'
  | 'approved'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'on_hold';

export interface SettlementFilters {
  status?: SettlementStatus;
  laundry_id?: string;
  partner_id?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
}

export interface SettlementDashboard {
  total_pending_settlements_inr: string;
  total_paid_settlements_inr: string;
  today_payouts_inr: string;
  monthly_payouts_inr: string;
  partner_earnings_inr: string;
  platform_commission_inr: string;
  pending_count: number;
  paid_count: number;
  on_hold_count: number;
  on_hold_inr: string;
}

export interface SettlementAnalytics {
  status_breakdown: Array<{ status: string; count: number; total_inr: string }>;
  monthly_payouts: Array<{ month: string; payout_inr: string; commission_inr: string; settlement_count: number }>;
  top_partners: Array<{ partner_user_id: string; partner_name: string; laundry_name: string; paid_inr: string; settlement_count: number }>;
  total_gross_paid_inr: string;
  total_commission_paid_inr: string;
  avg_settlement_inr: string;
}

export interface SettlementAuditRow {
  id: string;
  timestamp: string;
  user_name: string;
  action: string;
  settlement_id: string | null;
  settlement_code: string | null;
  old_value: string | null;
  new_value: string | null;
  note: string | null;
}

export interface SettlementRow {
  id: string;
  settlement_code: string;
  laundry_id: string;
  laundry_name: string;
  partner_user_id: string;
  partner_name: string;
  partner_email: string | null;
  period_start: string;
  period_end: string;
  orders_count: number;
  gross_revenue_inr: string;
  commission_inr: string;
  refund_inr: string;
  adjustment_inr: string;
  net_amount_inr: string;
  status: SettlementStatus;
  created_at: string;
  paid_at: string | null;
  payout_reference: string | null;
}

export interface PaginatedSettlements extends PaginatedList<SettlementRow> {
  /** @deprecated Use total_records */
  total?: number;
}

export interface SettlementDetail extends SettlementRow {
  approved_at: string | null;
  failed_reason: string | null;
  cancelled_reason: string | null;
  notes: string | null;
  held_at: string | null;
  held_reason: string | null;
  partner_name: string;
  line_items: Array<{
    order_id: string;
    gross_inr: string;
    commission_inr: string;
    refund_inr: string;
    net_inr: string;
  }>;
  adjustments: Array<{
    id: string;
    amount_inr: string;
    reason: string;
    created_at: string;
  }>;
}

export interface PartnerSettlementSummary {
  pending_earnings_inr: string;
  available_earnings_inr: string;
  in_flight_settlements_inr: string;
  released_earnings_inr: string;
  items: Array<Omit<SettlementRow, 'laundry_id' | 'partner_user_id' | 'partner_name' | 'partner_email' | 'payout_reference'>>;
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

function buildParams(filters: SettlementFilters): Record<string, string | number> {
  const p: Record<string, string | number> = {};
  if (filters.status) p.status = filters.status;
  if (filters.laundry_id) p.laundry_id = filters.laundry_id;
  if (filters.partner_id) p.partner_id = filters.partner_id;
  if (filters.date_from) p.date_from = filters.date_from;
  if (filters.date_to) p.date_to = filters.date_to;
  if (filters.page) p.page = filters.page;
  if (filters.page_size) p.page_size = filters.page_size;
  if (filters.sort_by) p.sort_by = filters.sort_by;
  if (filters.sort_dir) p.sort_dir = filters.sort_dir;
  return p;
}

export async function getSettlementDashboard(): Promise<SettlementDashboard> {
  const { data } = await api.get<ApiEnvelope<SettlementDashboard>>('/admin/settlements/dashboard');
  return data.data;
}

export async function getSettlementAnalytics(): Promise<SettlementAnalytics> {
  const { data } = await api.get<ApiEnvelope<SettlementAnalytics>>('/admin/settlements/analytics');
  return data.data;
}

export async function getSettlementAuditLog(settlementId?: string): Promise<SettlementAuditRow[]> {
  const { data } = await api.get<ApiEnvelope<SettlementAuditRow[]>>('/admin/settlements/audit', {
    params: settlementId ? { settlement_id: settlementId } : undefined,
  });
  return data.data;
}

export async function getSettlementTable(filters: SettlementFilters = {}): Promise<PaginatedSettlements> {
  const { data } = await api.get<ApiEnvelope<PaginatedSettlements>>('/admin/settlements', {
    params: buildParams(filters),
  });
  return data.data;
}

export async function getSettlementDetail(id: string): Promise<SettlementDetail> {
  const { data } = await api.get<ApiEnvelope<SettlementDetail>>(`/admin/settlements/${id}`);
  return data.data;
}

export async function runSettlementBatch(): Promise<{ settlements_created: number; eligibility_updated: number }> {
  const { data } = await api.post<ApiEnvelope<{ settlements_created: number; eligibility_updated: number }>>(
    '/admin/settlements/run',
  );
  return data.data;
}

export async function approveSettlement(id: string): Promise<SettlementDetail> {
  const { data } = await api.post<ApiEnvelope<SettlementDetail>>(`/admin/settlements/${id}/approve`);
  return data.data;
}

export async function rejectSettlement(id: string, reason: string): Promise<SettlementDetail> {
  const { data } = await api.post<ApiEnvelope<SettlementDetail>>(`/admin/settlements/${id}/reject`, { reason });
  return data.data;
}

export async function processSettlement(id: string): Promise<SettlementDetail> {
  const { data } = await api.post<ApiEnvelope<SettlementDetail>>(`/admin/settlements/${id}/process`);
  return data.data;
}

export async function releaseSettlementPayout(id: string, payout_reference: string): Promise<SettlementDetail> {
  const { data } = await api.post<ApiEnvelope<SettlementDetail>>(`/admin/settlements/${id}/release`, {
    payout_reference,
  });
  return data.data;
}

export async function failSettlement(id: string, reason: string): Promise<SettlementDetail> {
  const { data } = await api.post<ApiEnvelope<SettlementDetail>>(`/admin/settlements/${id}/fail`, { reason });
  return data.data;
}

export async function holdSettlement(id: string, reason: string): Promise<SettlementDetail> {
  const { data } = await api.post<ApiEnvelope<SettlementDetail>>(`/admin/settlements/${id}/hold`, { reason });
  return data.data;
}

export async function releaseSettlementHold(id: string): Promise<SettlementDetail> {
  const { data } = await api.post<ApiEnvelope<SettlementDetail>>(`/admin/settlements/${id}/release-hold`);
  return data.data;
}

export async function addSettlementAdjustment(
  id: string,
  body: { amount_inr: number; reason: string },
): Promise<SettlementDetail> {
  const { data } = await api.post<ApiEnvelope<SettlementDetail>>(`/admin/settlements/${id}/adjustments`, body);
  return data.data;
}

export async function downloadSettlementExport(
  filters: SettlementFilters = {},
  format: 'csv' | 'xlsx' | 'pdf' = 'csv',
): Promise<void> {
  const { data } = await api.get<Blob>('/admin/settlements/export', {
    params: { ...buildParams(filters), format },
    responseType: 'blob',
  });
  const ext = format === 'csv' ? 'csv' : format === 'xlsx' ? 'xls' : 'txt';
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `settlements.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function getPartnerSettlements(page = 1, pageSize = 25): Promise<PartnerSettlementSummary> {
  const { data } = await api.get<ApiEnvelope<PartnerSettlementSummary>>('/partner/settlements', {
    params: { page, page_size: pageSize },
  });
  return data.data;
}

export async function downloadPartnerSettlementExport(format: 'csv' | 'xlsx' | 'pdf' = 'csv'): Promise<void> {
  const { data } = await api.get<Blob>('/partner/settlements/export', {
    params: { format },
    responseType: 'blob',
  });
  const ext = format === 'csv' ? 'csv' : format === 'xlsx' ? 'xls' : 'txt';
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `settlement-statement.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}

export const SETTLEMENT_STATUS_LABELS: Record<SettlementStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  processing: 'Processing',
  paid: 'Paid',
  failed: 'Failed',
  cancelled: 'Cancelled',
  on_hold: 'On hold',
};
