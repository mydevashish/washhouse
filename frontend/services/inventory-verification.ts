import { api, type ApiEnvelope } from '@/lib/api';
import type { DeliveryProofPhoto } from '@/services/delivery-proof';

export const INVENTORY_ITEM_TYPES = [
  'shirts',
  'trousers',
  'sarees',
  'jackets',
  'bedsheets',
  'blankets',
  'curtains',
  'other',
] as const;

export type InventoryItemType = (typeof INVENTORY_ITEM_TYPES)[number];

export const INVENTORY_ITEM_LABELS: Record<InventoryItemType, string> = {
  shirts: 'Shirts',
  trousers: 'Trousers',
  sarees: 'Sarees',
  jackets: 'Jackets',
  bedsheets: 'Bedsheets',
  blankets: 'Blankets',
  curtains: 'Curtains',
  other: 'Other Items',
};

export type InventoryItems = Record<InventoryItemType, number>;

export type InventoryVerificationStatus = 'pending_customer' | 'locked' | 'change_pending';

export interface InventoryItemLine {
  item_type: InventoryItemType;
  label: string;
  quantity: number;
}

export interface InventoryVerification {
  id: string;
  order_id: string;
  customer_id: string;
  laundry_id: string;
  status: InventoryVerificationStatus;
  items: InventoryItemLine[];
  total_quantity: number;
  recorded_by_user_id: string;
  recorded_at: string;
  confirmed_by_user_id: string | null;
  confirmed_at: string | null;
  locked_at: string | null;
  is_locked: boolean;
  pending_change_request_id: string | null;
}

export interface InventoryHistoryEntry {
  id: string;
  order_id: string;
  verification_id: string;
  action: string;
  items_snapshot: { items: InventoryItems; total: number };
  actor_user_id: string;
  note: string | null;
  created_at: string;
}

export interface InventoryChangeRequest {
  id: string;
  order_id: string;
  verification_id: string;
  proposed_items: { items: InventoryItems; total: number };
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_by_user_id: string;
  reviewed_by_user_id: string | null;
  reviewed_at: string | null;
  admin_notes: string | null;
  created_at: string;
}

export function emptyInventoryItems(): InventoryItems {
  return {
    shirts: 0,
    trousers: 0,
    sarees: 0,
    jackets: 0,
    bedsheets: 0,
    blankets: 0,
    curtains: 0,
    other: 0,
  };
}

export function inventoryFromLines(lines: InventoryItemLine[]): InventoryItems {
  const base = emptyInventoryItems();
  for (const line of lines) {
    base[line.item_type] = line.quantity;
  }
  return base;
}

export function inventoryTotal(items: InventoryItems): number {
  return INVENTORY_ITEM_TYPES.reduce((sum, key) => sum + (items[key] ?? 0), 0);
}

export async function getPartnerInventoryVerification(orderId: string): Promise<InventoryVerification | null> {
  const { data } = await api.get<ApiEnvelope<InventoryVerification | null>>(
    `/partner/orders/${orderId}/inventory-verification`,
  );
  return data.data;
}

export async function recordPartnerInventory(
  orderId: string,
  items: InventoryItems,
  note?: string,
): Promise<InventoryVerification> {
  const { data } = await api.put<ApiEnvelope<InventoryVerification>>(
    `/partner/orders/${orderId}/inventory-verification`,
    { items, note },
  );
  return data.data;
}

export async function requestInventoryChange(
  orderId: string,
  items: InventoryItems,
  reason: string,
): Promise<InventoryChangeRequest> {
  const { data } = await api.post<ApiEnvelope<InventoryChangeRequest>>(
    `/partner/orders/${orderId}/inventory-verification/change-request`,
    { items, reason },
  );
  return data.data;
}

export async function getCustomerInventoryVerification(orderId: string): Promise<InventoryVerification | null> {
  const { data } = await api.get<ApiEnvelope<InventoryVerification | null>>(
    `/orders/${orderId}/inventory-verification`,
  );
  return data.data;
}

export async function confirmInventory(orderId: string): Promise<InventoryVerification> {
  const { data } = await api.post<ApiEnvelope<InventoryVerification>>(
    `/orders/${orderId}/inventory-verification/confirm`,
    {},
  );
  return data.data;
}

export async function listInventoryHistory(orderId: string): Promise<InventoryHistoryEntry[]> {
  const { data } = await api.get<ApiEnvelope<InventoryHistoryEntry[]>>(
    `/orders/${orderId}/inventory-verification/history`,
  );
  return data.data;
}

export async function listAdminInventoryChangeRequests(): Promise<InventoryChangeRequest[]> {
  const { data } = await api.get<ApiEnvelope<InventoryChangeRequest[]>>('/admin/inventory-change-requests');
  return data.data;
}

export async function approveInventoryChange(
  requestId: string,
  adminNotes?: string,
): Promise<InventoryVerification> {
  const { data } = await api.post<ApiEnvelope<InventoryVerification>>(
    `/admin/inventory-change-requests/${requestId}/approve`,
    { admin_notes: adminNotes },
  );
  return data.data;
}

export async function rejectInventoryChange(
  requestId: string,
  adminNotes?: string,
): Promise<InventoryChangeRequest> {
  const { data } = await api.post<ApiEnvelope<InventoryChangeRequest>>(
    `/admin/inventory-change-requests/${requestId}/reject`,
    { admin_notes: adminNotes },
  );
  return data.data;
}

import type { DisputeDetail, DisputeListItem } from '@/services/disputes';

export interface ComplaintListItem extends DisputeListItem {}
export interface ComplaintDetail extends DisputeDetail {}

export {
  listMyDisputes as listMyComplaints,
  getDisputeDetail as getComplaintDetail,
  fileDispute as createComplaint,
} from '@/services/disputes';

export type { DisputeListItem, DisputeDetail } from '@/services/disputes';
