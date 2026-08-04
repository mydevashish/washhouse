import { z } from 'zod';

import { isValidIndianMobileE164, normalizeIndianPhoneInput } from '@/features/admin/customer-desk/phone';

export const phoneSearchSchema = z
  .string()
  .trim()
  .min(1, 'Enter a phone number')
  .transform(normalizeIndianPhoneInput)
  .refine(isValidIndianMobileE164, {
    message: 'Use a valid Indian mobile (+91 and 10 digits starting 6–9)',
  });

const lineItemSchema = z.object({
  service_id: z.string().min(1, 'Select a service'),
  quantity: z.coerce.number().int().min(1, 'Min 1').max(500),
});

export const assistedOrderFormSchema = z
  .object({
    customer_name: z.string().trim().min(1, 'Customer name is required').max(200),
    phone: z
      .string()
      .transform(normalizeIndianPhoneInput)
      .refine(isValidIndianMobileE164, { message: 'Invalid phone' }),
    laundry_id: z.string().uuid('Select a laundry'),
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
