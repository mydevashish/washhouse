export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'picked_up'
  | 'washing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: string;
  user_id: string;
  laundry_id: string;
  status: OrderStatus;
  total_amount: string;
  currency: string;
  scheduled_at: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}
