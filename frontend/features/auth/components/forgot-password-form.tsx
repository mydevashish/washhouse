'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { AuthFooterLink, AuthFormCard } from '@/components/auth/auth-form-card';
import { WashhouseLoader } from '@/components/brand/washhouse-loader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from '@/features/auth/schemas/forgot-password.schema';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { forgotPassword } from '@/services/auth';

const SUCCESS_COPY =
  'If an account exists for that email, we sent a reset code. Check your inbox and spam folder.';

type ForgotPasswordFormProps = {
  /** Preserved from login `?audience=` when linking back. */
  audience?: string | null;
};

function loginHref(audience?: string | null): string {
  if (audience === 'partner' || audience === 'admin') {
    return `/login?audience=${audience}`;
  }
  return '/login';
}

function resetHref(email: string, audience?: string | null): string {
  const params = new URLSearchParams();
  params.set('email', email);
  if (audience === 'partner' || audience === 'admin') {
    params.set('audience', audience);
  }
  return `/reset-password?${params.toString()}`;
}

export function ForgotPasswordForm({ audience }: ForgotPasswordFormProps) {
  const router = useRouter();
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const successRef = useRef<HTMLHeadingElement>(null);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
    mode: 'onBlur',
  });

  const { errors, isSubmitting } = form.formState;
  const emailError = errors.email?.message;

  useEffect(() => {
    if (sent) successRef.current?.focus();
  }, [sent]);

  async function onSubmit(values: ForgotPasswordValues) {
    try {
      const res = await forgotPassword({ email: values.email });
      // Dev-only debug code — never log secrets; toast mirrors OTP login pattern.
      if (res.otp_debug) toast.message(`Dev reset code: ${res.otp_debug}`);
      setSentEmail(values.email);
      setSent(true);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not send reset email — try again'));
    }
  }

  function onInvalid() {
    document.getElementById('forgot-email')?.focus();
  }

  if (sent) {
    return (
      <div>
        <AuthFormCard
          title="Check your email"
          footer={
            <AuthFooterLink
              prompt="Remembered your password?"
              href={loginHref(audience)}
              linkText="Back to sign in"
            />
          }
        >
          <div className="space-y-4" role="status">
            <h2 ref={successRef} tabIndex={-1} className="sr-only">
              Reset email instructions
            </h2>
            <p className="text-sm text-muted-foreground" data-testid="forgot-password-success">
              {SUCCESS_COPY}
            </p>
            <Button
              type="button"
              className="w-full min-h-[44px]"
              size="lg"
              onClick={() => router.push(resetHref(sentEmail, audience))}
            >
              Enter reset code
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full min-h-[44px]"
              onClick={() => {
                setSent(false);
                form.reset({ email: sentEmail });
              }}
            >
              Use a different email
            </Button>
          </div>
        </AuthFormCard>
      </div>
    );
  }

  return (
    <div aria-busy={isSubmitting || undefined}>
      <AuthFormCard
        title="Forgot password"
        description="Enter your account email and we’ll send a reset code if it exists."
        footer={
          <AuthFooterLink
            prompt="Remembered your password?"
            href={loginHref(audience)}
            linkText="Back to sign in"
          />
        }
      >
        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-4" noValidate>
          <div className="grid gap-2">
            <Label htmlFor="forgot-email">Email</Label>
            <Input
              id="forgot-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={emailError ? true : undefined}
              aria-describedby={emailError ? 'forgot-email-error' : undefined}
              className="min-h-[44px]"
              {...form.register('email')}
            />
            {emailError ? (
              <p id="forgot-email-error" className="text-sm text-danger" role="alert">
                {emailError}
              </p>
            ) : null}
          </div>
          <Button
            type="submit"
            className="w-full min-h-[44px]"
            size="lg"
            disabled={isSubmitting}
            aria-busy={isSubmitting || undefined}
          >
            {isSubmitting ? 'Sending…' : 'Send reset code'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have a code?{' '}
            <Link
              href={audience ? `/reset-password?audience=${encodeURIComponent(audience)}` : '/reset-password'}
              className="inline-flex min-h-[44px] items-center font-semibold text-primary hover:underline"
            >
              Reset password
            </Link>
          </p>
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
