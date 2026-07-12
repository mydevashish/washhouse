import { api, type ApiEnvelope } from '@/lib/api';

export interface OwnershipPartner {
  id: string;
  name: string;
  ownership_pct: string;
  user_id: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlatformExpense {
  id: string;
  period_year: number;
  period_month: number;
  category: string;
  description: string;
  amount_inr: string;
  recorded_by: string;
  created_at: string;
}

export interface PeriodPreview {
  period_year: number;
  period_month: number;
  revenue_inr: string;
  expenses_inr: string;
  profit_inr: string;
  is_finalized: boolean;
}

export interface ProfitShareAllocation {
  id: string;
  period_id: string;
  period_year: number;
  period_month: number;
  partner_id: string;
  partner_name: string;
  ownership_pct: string;
  earnings_inr: string;
  payout_status: 'pending' | 'paid';
  paid_at: string | null;
  payment_reference: string | null;
}

export interface ProfitSharePeriod {
  id: string;
  period_year: number;
  period_month: number;
  revenue_inr: string;
  expenses_inr: string;
  profit_inr: string;
  status: string;
  finalized_at: string | null;
  allocations: ProfitShareAllocation[];
}

export interface ProfitSharingOverview {
  ownership_total_pct: string;
  ownership_valid: boolean;
  partners: OwnershipPartner[];
  pending_payouts_inr: string;
  paid_payouts_inr: string;
  current_period: PeriodPreview;
  recent_payouts: ProfitShareAllocation[];
}

export interface PartnerProfitSharingSummary {
  partner_id: string | null;
  partner_name: string | null;
  ownership_pct: string | null;
  pending_earnings_inr: string;
  paid_earnings_inr: string;
  pending_allocations: ProfitShareAllocation[];
  payout_history: ProfitShareAllocation[];
}

export const EXPENSE_CATEGORIES = [
  { value: 'operations', label: 'Operations' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'technology', label: 'Technology' },
  { value: 'personnel', label: 'Personnel' },
  { value: 'other', label: 'Other' },
] as const;

export async function getProfitSharingOverview(): Promise<ProfitSharingOverview> {
  const { data } = await api.get<ApiEnvelope<ProfitSharingOverview>>('/admin/profit-sharing/overview');
  return data.data;
}

export async function createOwnershipPartner(input: {
  name: string;
  ownership_pct: number;
  user_id?: string | null;
  notes?: string | null;
}): Promise<OwnershipPartner> {
  const { data } = await api.post<ApiEnvelope<OwnershipPartner>>('/admin/profit-sharing/partners', input);
  return data.data;
}

export async function updateOwnershipPartner(
  id: string,
  input: Partial<{ name: string; ownership_pct: number; user_id: string | null; is_active: boolean; notes: string | null }>,
): Promise<OwnershipPartner> {
  const { data } = await api.patch<ApiEnvelope<OwnershipPartner>>(`/admin/profit-sharing/partners/${id}`, input);
  return data.data;
}

export async function deactivateOwnershipPartner(id: string): Promise<OwnershipPartner> {
  const { data } = await api.delete<ApiEnvelope<OwnershipPartner>>(`/admin/profit-sharing/partners/${id}`);
  return data.data;
}

export async function listPlatformExpenses(year: number, month: number): Promise<PlatformExpense[]> {
  const { data } = await api.get<ApiEnvelope<PlatformExpense[]>>('/admin/profit-sharing/expenses', {
    params: { year, month },
  });
  return data.data;
}

export async function createPlatformExpense(input: {
  period_year: number;
  period_month: number;
  category: string;
  description: string;
  amount_inr: number;
}): Promise<PlatformExpense> {
  const { data } = await api.post<ApiEnvelope<PlatformExpense>>('/admin/profit-sharing/expenses', input);
  return data.data;
}

export async function deletePlatformExpense(id: string): Promise<void> {
  await api.delete(`/admin/profit-sharing/expenses/${id}`);
}

export async function previewProfitPeriod(year: number, month: number): Promise<PeriodPreview> {
  const { data } = await api.get<ApiEnvelope<PeriodPreview>>('/admin/profit-sharing/periods/preview', {
    params: { year, month },
  });
  return data.data;
}

export async function listProfitPeriods(): Promise<ProfitSharePeriod[]> {
  const { data } = await api.get<ApiEnvelope<ProfitSharePeriod[]>>('/admin/profit-sharing/periods');
  return data.data;
}

export async function finalizeProfitPeriod(year: number, month: number): Promise<ProfitSharePeriod> {
  const { data } = await api.post<ApiEnvelope<ProfitSharePeriod>>('/admin/profit-sharing/periods/finalize', {
    period_year: year,
    period_month: month,
  });
  return data.data;
}

export async function listPendingPayouts(): Promise<ProfitShareAllocation[]> {
  const { data } = await api.get<ApiEnvelope<ProfitShareAllocation[]>>('/admin/profit-sharing/payouts/pending');
  return data.data;
}

export async function listPayoutHistory(limit = 50): Promise<ProfitShareAllocation[]> {
  const { data } = await api.get<ApiEnvelope<ProfitShareAllocation[]>>('/admin/profit-sharing/payouts/history', {
    params: { limit },
  });
  return data.data;
}

export async function markPayoutPaid(allocationId: string, paymentReference: string): Promise<ProfitShareAllocation> {
  const { data } = await api.post<ApiEnvelope<ProfitShareAllocation>>(
    `/admin/profit-sharing/payouts/${allocationId}/mark-paid`,
    { payment_reference: paymentReference },
  );
  return data.data;
}

export async function getPartnerProfitSharingSummary(): Promise<PartnerProfitSharingSummary> {
  const { data } = await api.get<ApiEnvelope<PartnerProfitSharingSummary>>('/platform-partner/profit-sharing/summary');
  return data.data;
}

export function formatPeriodLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}
