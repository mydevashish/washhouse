'use client';

import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { AuthFooterLink, AuthFormCard } from '@/components/auth/auth-form-card';
import { WashhouseLoader } from '@/components/brand/washhouse-loader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from '@/features/auth/schemas/reset-password.schema';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { resetPassword } from '@/services/auth';

type ResetPasswordFormProps = {
  initialEmail?: string;
  initialCode?: string;
  audience?: string | null;
};

function loginHref(audience?: string | null): string {
  if (audience === 'partner' || audience === 'admin') {
    return `/login?audience=${audience}`;
  }
  return '/login';
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm text-danger" role="alert">
      {message}
    </p>
  );
}

export function ResetPasswordForm({
  initialEmail = '',
  initialCode = '',
  audience,
}: ResetPasswordFormProps) {
  const router = useRouter();
  const formErrorRef = useRef<HTMLParagraphElement>(null);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: initialEmail,
      code: initialCode,
      new_password: '',
      confirm_password: '',
    },
    mode: 'onBlur',
  });

  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: ResetPasswordValues) {
    try {
      await resetPassword({
        email: values.email,
        code: values.code,
        new_password: values.new_password,
      });
      toast.success('Password updated — sign in with your new password');
      router.push(loginHref(audience));
    } catch (err) {
      const message = getApiErrorMessage(err, 'Could not reset password — check the code and try again');
      toast.error(message);
      if (formErrorRef.current) {
        formErrorRef.current.textContent = message;
        formErrorRef.current.focus();
      }
    }
  }

  function onInvalid(fieldErrors: typeof errors) {
    const firstErrorKey = (
      ['email', 'code', 'new_password', 'confirm_password'] as const
    ).find((key) => fieldErrors[key]);
    if (!firstErrorKey) return;
    const id = `reset-${firstErrorKey.replace('_', '-')}`;
    document.getElementById(id)?.focus();
  }

  const missingCodeHint = !initialCode;

  return (
    <div aria-busy={isSubmitting || undefined}>
      <AuthFormCard
        title="Reset password"
        description={
          missingCodeHint
            ? 'Enter the email and code from your inbox, then choose a new password.'
            : 'Choose a new password for your account.'
        }
        footer={
          <AuthFooterLink
            prompt="Back to"
            href={loginHref(audience)}
            linkText="Sign in"
          />
        }
      >
        <p ref={formErrorRef} tabIndex={-1} className="sr-only" role="alert" aria-live="assertive" />
        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-4" noValidate>
          <div className="grid gap-2">
            <Label htmlFor="reset-email">Email</Label>
            <Input
              id="reset-email"
              type="email"
              autoComplete="email"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? 'reset-email-error' : undefined}
              className="min-h-[44px]"
              {...form.register('email')}
            />
            <FieldError id="reset-email-error" message={errors.email?.message} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reset-code">Reset code</Label>
            <Input
              id="reset-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6-digit code"
              aria-invalid={errors.code ? true : undefined}
              aria-describedby={errors.code ? 'reset-code-error' : undefined}
              className="min-h-[44px]"
              {...form.register('code')}
            />
            <FieldError id="reset-code-error" message={errors.code?.message} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reset-new-password">New password</Label>
            <Input
              id="reset-new-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              placeholder="At least 8 characters"
              aria-invalid={errors.new_password ? true : undefined}
              aria-describedby={errors.new_password ? 'reset-new-password-error' : undefined}
              className="min-h-[44px]"
              {...form.register('new_password')}
            />
            <FieldError id="reset-new-password-error" message={errors.new_password?.message} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reset-confirm-password">Confirm new password</Label>
            <Input
              id="reset-confirm-password"
              type="password"
              autoComplete="new-password"
              aria-invalid={errors.confirm_password ? true : undefined}
              aria-describedby={
                errors.confirm_password ? 'reset-confirm-password-error' : undefined
              }
              className="min-h-[44px]"
              {...form.register('confirm_password')}
            />
            <FieldError
              id="reset-confirm-password-error"
              message={errors.confirm_password?.message}
            />
          </div>
          <Button
            type="submit"
            className="w-full min-h-[44px]"
            size="lg"
            disabled={isSubmitting}
            aria-busy={isSubmitting || undefined}
          >
            {isSubmitting ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      </AuthFormCard>
      {isSubmitting ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 px-4">
          <WashhouseLoader size="md" label="Please wait…" />
        </div>
      ) : null}
    </div>
  );
}
