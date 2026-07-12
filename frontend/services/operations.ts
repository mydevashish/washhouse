import { api, type ApiEnvelope } from '@/lib/api';

export type TaskAssignmentType = 'pickup' | 'delivery';

export interface OperationsDashboard {
  laundry_id: string;
  laundry_name: string;
  pickups_today: number;
  deliveries_today: number;
  todays_pickups: number;
  todays_deliveries: number;
  delayed_orders: number;
  assigned_drivers: number;
  active_drivers: number;
  pending_tasks: number;
  failed_deliveries: number;
  avg_delivery_time_minutes: number | null;
  completed_orders_today: number;
}

export interface TaskAssignment {
  id: string;
  staff_id: string;
  staff_name: string;
  status: string;
  assigned_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface OperationsOrderRow {
  order_id: string;
  tracking_code: string;
  customer_name: string;
  status: string;
  pickup_at: string;
  delivery_at: string;
  total_inr: string;
  is_delayed: boolean;
  queue_status: string;
  assignment: TaskAssignment | null;
}

export interface QueueBucket {
  status: string;
  label: string;
  count: number;
  orders: OperationsOrderRow[];
}

export interface PickupQueue {
  buckets: QueueBucket[];
  total: number;
}

export interface DeliveryQueue {
  buckets: QueueBucket[];
  total: number;
}

export interface DriverSummary {
  staff_id: string;
  name: string;
  role: string;
  role_label: string;
  is_active: boolean;
  daily_capacity: number;
  active_tasks: number;
  completed_today: number;
  workload_pct: number;
  available: boolean;
}

export async function getOperationsDashboard(): Promise<OperationsDashboard> {
  const { data } = await api.get<ApiEnvelope<OperationsDashboard>>('/partner/operations/dashboard');
  return data.data;
}

export async function getPickupQueue(): Promise<PickupQueue> {
  const { data } = await api.get<ApiEnvelope<PickupQueue>>('/partner/operations/pickups');
  return data.data;
}

export async function getDeliveryQueue(): Promise<DeliveryQueue> {
  const { data } = await api.get<ApiEnvelope<DeliveryQueue>>('/partner/operations/deliveries');
  return data.data;
}

export async function listOperationsDrivers(): Promise<DriverSummary[]> {
  const { data } = await api.get<ApiEnvelope<DriverSummary[]>>('/partner/operations/drivers');
  return data.data;
}

export async function assignDriver(body: {
  order_id: string;
  staff_id: string;
  task_type: TaskAssignmentType;
  notes?: string;
}): Promise<OperationsOrderRow> {
  const { data } = await api.post<ApiEnvelope<OperationsOrderRow>>('/partner/operations/assignments', body);
  return data.data;
}

export async function reassignDriver(
  assignmentId: string,
  body: { staff_id: string; notes?: string },
): Promise<OperationsOrderRow> {
  const { data } = await api.patch<ApiEnvelope<OperationsOrderRow>>(
    `/partner/operations/assignments/${assignmentId}/reassign`,
    body,
  );
  return data.data;
}

export async function updateAssignmentStatus(
  assignmentId: string,
  body: { status: string; notes?: string },
): Promise<OperationsOrderRow> {
  const { data } = await api.patch<ApiEnvelope<OperationsOrderRow>>(
    `/partner/operations/assignments/${assignmentId}/status`,
    body,
  );
  return data.data;
}
