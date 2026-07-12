import { serviceDeliveryHours } from '@/features/discover/lib/laundry-meta';
import type { LaundryServiceItem } from '@/services/laundries';

/** Matches backend `OrderService.create_order` defaults. */
export const DELIVERY_FEE_INR = 49;
export const GST_RATE_PERCENT = 18;

export type OrderLineItem = {
  service: LaundryServiceItem;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type OrderQuote = {
  lines: OrderLineItem[];
  subtotal: number;
  deliveryFee: number;
  cgst: number;
  sgst: number;
  taxesTotal: number;
  total: number;
  maxDeliveryHours: number;
  estimatedDeliveryBy: Date | null;
  itemCount: number;
};

export function buildOrderLines(
  services: LaundryServiceItem[],
  quantities: Record<string, number>,
): OrderLineItem[] {
  return services
    .filter((s) => (quantities[s.id] ?? 0) > 0)
    .map((service) => {
      const quantity = quantities[service.id]!;
      const unitPrice = Number(service.price_inr);
      return {
        service,
        quantity,
        unitPrice,
        lineTotal: unitPrice * quantity,
      };
    });
}

export function computeOrderQuote(
  services: LaundryServiceItem[],
  quantities: Record<string, number>,
): OrderQuote {
  const lines = buildOrderLines(services, quantities);
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);

  if (lines.length === 0) {
    return {
      lines: [],
      subtotal: 0,
      deliveryFee: 0,
      cgst: 0,
      sgst: 0,
      taxesTotal: 0,
      total: 0,
      maxDeliveryHours: 0,
      estimatedDeliveryBy: null,
      itemCount: 0,
    };
  }

  const deliveryFee = DELIVERY_FEE_INR;
  const taxable = subtotal + deliveryFee;
  const halfGst = (taxable * GST_RATE_PERCENT) / 200;
  const cgst = roundMoney(halfGst);
  const sgst = roundMoney(halfGst);
  const taxesTotal = cgst + sgst;
  const total = roundMoney(taxable + taxesTotal);

  const maxDeliveryHours = Math.max(
    ...lines.map((l) => serviceDeliveryHours(l.service.category)),
  );
  const estimatedDeliveryBy = addBusinessHours(new Date(), maxDeliveryHours);

  return {
    lines,
    subtotal: roundMoney(subtotal),
    deliveryFee,
    cgst,
    sgst,
    taxesTotal,
    total,
    maxDeliveryHours,
    estimatedDeliveryBy,
    itemCount,
  };
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Add calendar hours (simplified business estimate). */
function addBusinessHours(from: Date, hours: number): Date {
  const d = new Date(from);
  d.setHours(d.getHours() + hours);
  return d;
}

export function formatDeliveryEstimate(date: Date | null): string {
  if (!date) return '—';
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);
}
