import { forgotPasswordSchema } from '@/features/auth/schemas/forgot-password.schema';
import {
  resetCodeFromSearchParams,
  resetPasswordSchema,
} from '@/features/auth/schemas/reset-password.schema';

describe('forgotPasswordSchema', () => {
  it('requires a valid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: '' }).success).toBe(false);
    expect(forgotPasswordSchema.safeParse({ email: 'not-an-email' }).success).toBe(false);
    expect(forgotPasswordSchema.safeParse({ email: 'you@example.com' }).success).toBe(true);
  });

  it('trims whitespace', () => {
    const result = forgotPasswordSchema.safeParse({ email: '  you@example.com  ' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe('you@example.com');
  });
});

describe('resetPasswordSchema', () => {
  const valid = {
    email: 'you@example.com',
    code: '123456',
    new_password: 'password1',
    confirm_password: 'password1',
  };

  it('accepts a valid payload', () => {
    expect(resetPasswordSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects short passwords', () => {
    const result = resetPasswordSchema.safeParse({
      ...valid,
      new_password: 'short',
      confirm_password: 'short',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.new_password?.[0]).toMatch(/at least 8/i);
    }
  });

  it('rejects mismatched confirmation', () => {
    const result = resetPasswordSchema.safeParse({
      ...valid,
      confirm_password: 'different1',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.confirm_password?.[0]).toMatch(/do not match/i);
    }
  });

  it('rejects short or empty codes', () => {
    expect(resetPasswordSchema.safeParse({ ...valid, code: '12' }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ ...valid, code: '' }).success).toBe(false);
  });
});

describe('resetCodeFromSearchParams', () => {
  it('prefers code over token', () => {
    const params = new URLSearchParams('code=111111&token=222222');
    expect(resetCodeFromSearchParams(params)).toBe('111111');
  });

  it('falls back to token', () => {
    const params = new URLSearchParams('token=654321');
    expect(resetCodeFromSearchParams(params)).toBe('654321');
  });

  it('returns empty when neither is present', () => {
    expect(resetCodeFromSearchParams(new URLSearchParams())).toBe('');
  });
});
