import { z } from 'zod';

import {
  partnerPhoneFieldSchema,
  PARTNER_PHONE_INLINE_ERROR,
} from '@/features/partner/lib/partner-phone-schema';

export const phoneSearchSchema = partnerPhoneFieldSchema;

const lineItemSchema = z.object({
  service_id: z.string().min(1, 'Select a service'),
  quantity: z.coerce.number().int().min(1, 'Min 1').max(500),
});

/** Partner assisted form — laundry_id is locked to token laundry. */
export const assistedOrderFormSchema = z
  .object({
    customer_name: z.string().trim().min(1, 'Customer name is required').max(200),
    phone: partnerPhoneFieldSchema,
    laundry_id: z.string().uuid('Laundry is required'),
    address_line1: z.string().trim().min(1, 'Address is required').max(300),
    address_line2: z.string().trim().max(200).optional().or(z.literal('')),
    address_city: z.string().trim().min(1, 'City is required').max(100),
    address_pincode: z
      .string()
      .trim()
      .regex(/^\d{6}$/, 'Enter a 6-digit pincode'),
    address_landmark: z.string().trim().max(200).optional().or(z.literal('')),
    pickup_at: z.string().min(1, 'Pickup time is required'),
    delivery_at: z.string().min(1, 'Delivery time is required'),
    notes: z.string().trim().max(2000).optional().or(z.literal('')),
    items: z.array(lineItemSchema).min(1, 'Add at least one service'),
  })
  .superRefine((val, ctx) => {
    const pickup = new Date(val.pickup_at);
    const delivery = new Date(val.delivery_at);
    if (Number.isNaN(pickup.getTime())) {
      ctx.addIssue({ code: 'custom', path: ['pickup_at'], message: 'Invalid pickup time' });
    }
    if (Number.isNaN(delivery.getTime())) {
      ctx.addIssue({ code: 'custom', path: ['delivery_at'], message: 'Invalid delivery time' });
    }
    if (
      !Number.isNaN(pickup.getTime()) &&
      !Number.isNaN(delivery.getTime()) &&
      delivery <= pickup
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['delivery_at'],
        message: 'Delivery must be after pickup',
      });
    }
  });

export type AssistedOrderFormValues = z.infer<typeof assistedOrderFormSchema>;
export type PhoneSearchValue = z.infer<typeof phoneSearchSchema>;

/**
 * Parse desk `item_summary` ("Wash & Fold ×2, Dry Clean ×1") into name/qty pairs
 * for catalog matching on reorder.
 */
export function parseItemSummary(
  summary: string | null | undefined,
): { name: string; quantity: number }[] {
  if (!summary?.trim()) return [];
  return summary
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const match = part.match(/^(.*?)\s*[×x]\s*(\d+)\s*$/i);
      if (match) {
        return { name: match[1]!.trim(), quantity: Number(match[2]) || 1 };
      }
      return { name: part, quantity: 1 };
    });
}
