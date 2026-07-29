import { z } from 'zod';

export const resetPasswordSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, 'Email is required')
      .email('Enter a valid email address'),
    code: z
      .string()
      .trim()
      .min(4, 'Enter the code from your email')
      .max(8, 'Code is too long'),
    new_password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password is too long'),
    confirm_password: z.string().min(1, 'Confirm your new password'),
  })
  .refine((values) => values.new_password === values.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

/** Prefill reset code from `?code=` or `?token=` (API expects `code`). */
export function resetCodeFromSearchParams(
  params: Pick<URLSearchParams, 'get'> | { get: (key: string) => string | null },
): string {
  return (params.get('code') ?? params.get('token') ?? '').trim();
}
