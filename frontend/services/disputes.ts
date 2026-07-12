import { api, type ApiEnvelope } from '@/lib/api';
import { mediaUrl } from '@/lib/media-url';
import type { CustodyTimeline } from '@/services/custody-timeline';
import type { DeliveryProofPhoto } from '@/services/delivery-proof';
import type { DeliveryVerificationStatus } from '@/services/delivery-otp';
import type { InventoryVerification } from '@/services/inventory-verification';
import type { PickupEvidencePhoto } from '@/services/pickup-evidence';

export const DISPUTE_TYPES = [
  { value: 'missing_item', label: 'Missing Item' },
  { value: 'damaged_item', label: 'Damaged Item' },
  { value: 'wrong_item', label: 'Wrong Item' },
  { value: 'late_delivery', label: 'Late Delivery' },
  { value: 'quality_issue', label: 'Quality Issue' },
  { value: 'refund_request', label: 'Refund Request' },
  { value: 'payment_issue', label: 'Payment Issue' },
  { value: 'other', label: 'Other' },
] as const;

export type DisputeType = (typeof DISPUTE_TYPES)[number]['value'];

export const DISPUTE_STATUSES = [
  'open',
  'investigating',
  'awaiting_customer',
  'awaiting_partner',
  'resolved',
  'rejected',
  'escalated',
  'closed',
] as const;

export const DISPUTE_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;

export type DisputePriority = (typeof DISPUTE_PRIORITIES)[number];

export type DisputeStatus = (typeof DISPUTE_STATUSES)[number];

export const DISPUTE_STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  investigating: 'Investigating',
  awaiting_customer: 'Awaiting Customer',
  awaiting_partner: 'Awaiting Partner',
  in_review: 'Investigating',
  resolved: 'Resolved',
  rejected: 'Rejected',
  escalated: 'Escalated',
  closed: 'Closed',
};

export const DISPUTE_PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export interface DisputePhoto {
  id: string;
  complaint_id: string;
  sort_index: number;
  created_at: string;
  original_url: string;
  compressed_url: string;
}

export interface DisputeStatusEvent {
  id: string;
  complaint_id: string;
  status: DisputeStatus | string;
  status_label: string;
  actor_user_id: string | null;
  actor_role: string;
  actor_name: string | null;
  note: string | null;
  created_at: string;
}

export interface DisputeListItem {
  id: string;
  order_id: string | null;
  complaint_type: string;
  type_label: string;
  description: string;
  status: DisputeStatus | string;
  status_label: string;
  created_at: string;
  tracking_code: string | null;
  customer_name?: string | null;
  photo_count: number;
}

export interface DisputeDetail extends DisputeListItem {
  admin_notes: string | null;
  photos: DisputePhoto[];
  status_events: DisputeStatusEvent[];
  inventory_verification: InventoryVerification | null;
  inventory_history_count: number;
  pickup_evidence: PickupEvidencePhoto[];
  delivery_proof: DeliveryProofPhoto | null;
  delivery_verification: DeliveryVerificationStatus | null;
  custody_timeline: CustodyTimeline | null;
}

export async function listMyDisputes(): Promise<DisputeListItem[]> {
  const { data } = await api.get<ApiEnvelope<DisputeListItem[]>>('/complaints');
  return data.data;
}

export async function getDisputeDetail(disputeId: string): Promise<DisputeDetail> {
  const { data } = await api.get<ApiEnvelope<DisputeDetail>>(`/complaints/${disputeId}`);
  return data.data;
}

export async function fileDispute(input: {
  orderId: string;
  complaintType: DisputeType;
  description: string;
  photos?: File[];
}): Promise<{ id: string; status: string }> {
  const form = new FormData();
  form.append('order_id', input.orderId);
  form.append('complaint_type', input.complaintType);
  form.append('description', input.description);
  for (const file of input.photos ?? []) {
    form.append('files', file);
  }
  const { data } = await api.post<ApiEnvelope<{ id: string; status: string }>>('/complaints', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120_000,
  });
  return data.data;
}

export interface DisputeAdminRow {
  id: string;
  order_id: string | null;
  tracking_code: string | null;
  customer_id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  laundry_id: string | null;
  laundry_name: string | null;
  laundry_city: string | null;
  partner_name: string | null;
  complaint_type: string;
  type_label: string;
  priority: DisputePriority;
  priority_label: string;
  status: DisputeStatus | string;
  status_label: string;
  description: string;
  created_at: string;
  updated_at: string;
  assigned_to_user_id: string | null;
  assigned_to_name: string | null;
  assigned_to_email?: string | null;
  assigned_to_role?: string | null;
  assigned_at?: string | null;
  photo_count: number;
  resolved_at: string | null;
  sla_hours: number;
  sla_deadline_at: string;
  sla_status: string;
  sla_status_label: string;
  time_remaining_seconds: number;
  overdue_seconds: number;
  escalation_countdown_seconds: number;
  is_breached: boolean;
  is_at_risk: boolean;
}

export interface DisputeAdminTable {
  items: DisputeAdminRow[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface DisputeAdminMetrics {
  open_disputes: number;
  critical_disputes: number;
  resolved_today: number;
  pending_investigation: number;
  unassigned_disputes: number;
  my_open_disputes: number;
  near_sla_breach: number;
  breached_sla: number;
  dispute_rate_pct: string;
  avg_resolution_hours: string;
}

export interface DisputeAssignee {
  id: string;
  full_name: string;
  email: string | null;
  role: string;
  role_label: string;
}

export interface DisputeInternalNote {
  id: string;
  complaint_id: string;
  author_user_id: string | null;
  author_name: string | null;
  body: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
}

export interface DisputePartyRiskProfile {
  risk_score: number;
  risk_level: string;
  risk_label: string;
  trust_score: number;
  dispute_frequency_30d: number;
  dispute_frequency_pct: string;
  refund_rate_pct: string;
  previous_claims: number;
  previous_complaints: number;
}

export interface DisputeFraudRiskContext {
  overall_risk_level: string;
  overall_risk_label: string;
  customer: DisputePartyRiskProfile;
  partner: DisputePartyRiskProfile | null;
}

export interface DisputeAdminDetail extends DisputeDetail {
  priority: DisputePriority;
  priority_label: string;
  assigned_to_user_id: string | null;
  assigned_to_name: string | null;
  assigned_at?: string | null;
  updated_at: string;
  resolved_at: string | null;
  sla_hours: number;
  sla_deadline_at: string;
  sla_status: string;
  sla_status_label: string;
  time_remaining_seconds: number;
  overdue_seconds: number;
  escalation_countdown_seconds: number;
  is_breached: boolean;
  is_at_risk: boolean;
  customer_email: string | null;
  customer_phone: string | null;
  laundry_name: string | null;
  partner_name: string | null;
  fraud_risk: DisputeFraudRiskContext;
  internal_notes: DisputeInternalNote[];
}

export interface DisputeTableFilters {
  q?: string;
  status?: string;
  priority?: string;
  complaint_type?: string;
  resolution_status?: string;
  assigned_to?: string;
  unassigned_only?: boolean;
  sla_status?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
}

function buildDisputeParams(filters: DisputeTableFilters): Record<string, string | number | boolean> {
  const p: Record<string, string | number | boolean> = {};
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && v !== false) p[k] = v;
  });
  return p;
}

export async function getDisputeAssignees(): Promise<DisputeAssignee[]> {
  const { data } = await api.get<ApiEnvelope<DisputeAssignee[]>>('/complaints/admin/assignees');
  return data.data;
}

export async function assignDispute(
  disputeId: string,
  assignedToUserId: string | null,
): Promise<void> {
  await api.patch(`/complaints/admin/${disputeId}/assign`, {
    assigned_to_user_id: assignedToUserId,
  });
}

export async function getDisputeAdminMetrics(): Promise<DisputeAdminMetrics> {
  const { data } = await api.get<ApiEnvelope<DisputeAdminMetrics>>('/complaints/admin/metrics');
  return data.data;
}

export async function getDisputeAdminTable(filters: DisputeTableFilters = {}): Promise<DisputeAdminTable> {
  const { data } = await api.get<ApiEnvelope<DisputeAdminTable>>('/complaints/admin/datatable', {
    params: buildDisputeParams(filters),
  });
  return data.data;
}

export async function getDisputeAdminDetail(disputeId: string): Promise<DisputeAdminDetail> {
  const { data } = await api.get<ApiEnvelope<DisputeAdminDetail>>(
    `/complaints/admin/datatable/${disputeId}`,
  );
  return data.data;
}

export async function bulkDisputeAction(body: {
  complaint_ids: string[];
  action: 'assign' | 'status' | 'escalate' | 'close' | 'note';
  assigned_to_user_id?: string;
  status?: DisputeStatus;
  priority?: DisputePriority;
  note?: string;
}): Promise<{ updated: number }> {
  const { data } = await api.post<ApiEnvelope<{ updated: number }>>('/complaints/admin/bulk', body);
  return data.data;
}

export async function addDisputeInternalNote(
  disputeId: string,
  body: string,
): Promise<DisputeAdminDetail> {
  const { data } = await api.post<ApiEnvelope<DisputeAdminDetail>>(
    `/complaints/admin/${disputeId}/notes`,
    { body },
  );
  return data.data;
}

export async function downloadDisputeExport(
  filters: DisputeTableFilters = {},
  format: 'csv' | 'xlsx' = 'csv',
): Promise<void> {
  const { data } = await api.get<Blob>('/complaints/admin/export', {
    params: { ...buildDisputeParams(filters), format },
    responseType: 'blob',
  });
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `disputes.${format === 'xlsx' ? 'xls' : 'csv'}`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function listAdminDisputes(): Promise<DisputeListItem[]> {
  const { data } = await api.get<ApiEnvelope<DisputeListItem[]>>('/complaints/admin/list');
  return data.data;
}

export async function getAdminDisputeDetail(disputeId: string): Promise<DisputeDetail> {
  const { data } = await api.get<ApiEnvelope<DisputeDetail>>(`/complaints/admin/${disputeId}`);
  return data.data;
}

export async function updateDisputeStatus(
  disputeId: string,
  body: { status: DisputeStatus; admin_notes?: string; note?: string },
): Promise<DisputeDetail> {
  const { data } = await api.patch<ApiEnvelope<DisputeDetail>>(
    `/complaints/admin/${disputeId}/status`,
    body,
  );
  return data.data;
}

export async function fetchDisputePhoto(
  photo: DisputePhoto,
  variant: 'compressed' | 'original' = 'compressed',
): Promise<Blob> {
  const path = variant === 'original' ? photo.original_url : photo.compressed_url;
  const { data } = await api.get<Blob>(mediaUrl(path), { responseType: 'blob' });
  return data;
}

/** @deprecated use listMyDisputes */
export const listMyComplaints = listMyDisputes;
/** @deprecated use getDisputeDetail */
export const getComplaintDetail = getDisputeDetail;
/** @deprecated use fileDispute */
export const createComplaint = fileDispute;
