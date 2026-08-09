/** Customer Desk — partner types (Slice 1 lookup/history + Slice 2 create contract). */

export type CustomerDeskProfile = {
  user_id: string | null;
  name: string | null;
  phone: string;
  email: string | null;
  registered: boolean;
  order_count: number;
  last_order_at: string | null;
};

export type CustomerDeskOrderSource =
  | 'online'
  | 'walk_in'
  | 'assisted_admin'
  | 'assisted_partner'
  | string;

export type CustomerDeskOrderRow = {
  id: string;
  tracking_code: string;
  status: string;
  order_source: CustomerDeskOrderSource;
  laundry_id: string;
  laundry_name: string;
  customer_name: string | null;
  customer_phone: string | null;
  subtotal_inr: string;
  delivery_fee_inr: string;
  cgst_inr: string;
  sgst_inr: string;
  total_inr: string;
  currency: string;
  pickup_at: string;
  delivery_at: string;
  created_at: string;
  created_by_user_id: string | null;
  item_summary: string | null;
};

export type CustomerDeskOrdersPage = {
  items: CustomerDeskOrderRow[];
  page: number;
  page_size: number;
  total_records: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
};

export type CustomerDeskOrdersFilters = {
  status?: string;
  date_from?: string;
  date_to?: string;
  q?: string;
  page?: number;
  page_size?: number;
};

export type AssistedOrderAddress = {
  line1: string;
  line2?: string;
  city: string;
  pincode: string;
  landmark?: string;
};

export type AssistedOrderItem = {
  service_id: string;
  quantity: number;
};

export type AssistedOrderCreatePayload = {
  phone: string;
  customer_name: string;
  laundry_id: string;
  address_id?: string | null;
  address?: AssistedOrderAddress | null;
  pickup_at: string;
  delivery_at: string;
  items: AssistedOrderItem[];
  notes?: string;
  payment_method?: 'cod';
  reorder_from_order_id?: string | null;
  save_address_to_user?: boolean;
  coupon_code?: string;
};

export type AssistedOrderQuote = {
  subtotal_inr: string;
  delivery_fee_inr: string;
  gst_rate: string;
  cgst_inr: string;
  sgst_inr: string;
  total_inr: string;
  currency: string;
  warnings: string[];
};

export type AssistedOrderCreateResult = {
  id: string;
  tracking_code: string;
  status: string;
  total_inr: string;
  currency?: string;
};

export type CustomerDeskLookupParams = { phone: string } | { user_id: string };

export type ReorderPrefill = {
  orderId: string;
  trackingCode: string;
  itemSummary: string | null;
};

export function customerDeskLookupKey(params: CustomerDeskLookupParams): string {
  return 'phone' in params ? params.phone : params.user_id;
}

/** Guest stub when partner lookup 404s — still allows walk-in / assisted create. */
export function guestDeskProfile(phone: string): CustomerDeskProfile {
  return {
    user_id: null,
    name: null,
    phone,
    email: null,
    registered: false,
    order_count: 0,
    last_order_at: null,
  };
}
