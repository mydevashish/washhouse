'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { AuthFooterLink, AuthFormCard } from '@/components/auth/auth-form-card';
import { WashhouseLoader } from '@/components/brand/washhouse-loader';
import { WashhouseLogo } from '@/components/brand/washhouse-logo';
import { PublicShell } from '@/components/layout/public-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getPostLoginPath } from '@/lib/auth-routing';
import {
  getLoginAudienceCopy,
  parseLoginAudience,
} from '@/lib/auth-login-audience';
import { isApiError } from '@/lib/api';
import { getNetworkErrorMessage, isNetworkError } from '@/lib/api-errors';
import { login, sendOtp, verifyOtp } from '@/services/auth';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

function safeNextPath(next: string | null): string | null {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return null;
  return next;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);

  useEffect(() => {
    const message = searchParams.get('message');
    if (message) toast.message(message);
  }, [searchParams]);

  const audience = parseLoginAudience(searchParams.get('audience'));
  const audienceCopy = getLoginAudienceCopy(audience);

  const [mode, setMode] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [otpPhone, setOtpPhone] = useState('');

  useEffect(() => {
    if (!audienceCopy.showOtpTab) setMode('email');
  }, [audienceCopy.showOtpTab]);

  function afterLogin(role: string) {
    const next =
      typeof window !== 'undefined'
        ? safeNextPath(new URLSearchParams(window.location.search).get('next'))
        : null;
    if (next) {
      router.push(next);
      return;
    }
    router.push(getPostLoginPath(role));
  }

  async function onEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    try {
      const result = await login({
        email: String(fd.get('email')),
        password: String(fd.get('password')),
      });
      setUser(result.user);
      setAccessToken(result.tokens.access_token);
      toast.success('Welcome back');
      afterLogin(result.user.role);
    } catch (err) {
      if (isNetworkError(err)) {
        toast.error(getNetworkErrorMessage());
      } else if (isApiError(err)) {
        const msg =
          (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error
            ?.message ?? 'Invalid email or password';
        toast.error(msg);
      } else {
        toast.error('Sign-in failed — try again');
      }
    } finally {
      setLoading(false);
    }
  }

  async function onOtpSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const phone = String(new FormData(e.currentTarget).get('phone'));
    setLoading(true);
    try {
      const res = await sendOtp(phone);
      if (res.otp_debug) toast.message(`Dev OTP: ${res.otp_debug}`);
      else toast.success('OTP sent to your phone');
      setOtpPhone(phone);
      setMode('otp');
    } catch {
      toast.error('Could not send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function onOtpVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    try {
      const result = await verifyOtp({
        phone: String(fd.get('phone')),
        code: String(fd.get('code')),
        full_name: String(fd.get('full_name') || 'Customer'),
      });
      setUser(result.user);
      setAccessToken(result.tokens.access_token);
      toast.success('Signed in');
      afterLogin(result.user.role);
    } catch {
      toast.error('Invalid OTP — try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div aria-busy={loading || undefined}>
      <PublicShell showBack={false}>
        <div className="mx-auto w-full max-w-md px-4 pt-6 sm:px-0">
          <Link
            href={audienceCopy.backHref}
            className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            {audienceCopy.backLabel}
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-md justify-center px-4 pt-4 sm:px-0">
          <div className="inline-flex max-w-full justify-center rounded-md p-1.5 dark:bg-white/90">
            <WashhouseLogo href="/" priority adaptive={false} />
          </div>
        </div>
        <AuthFormCard
          className="min-h-0 justify-start pt-4"
          title={audienceCopy.title}
          description={audienceCopy.description}
          footer={
            audienceCopy.footerPrompt && audienceCopy.footerHref && audienceCopy.footerLinkText ? (
              <AuthFooterLink
                prompt={audienceCopy.footerPrompt}
                href={audienceCopy.footerHref}
                linkText={audienceCopy.footerLinkText}
              />
            ) : undefined
          }
        >
          {audienceCopy.showOtpTab ? (
            <div
              className="mb-6 grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted p-1"
              role="tablist"
              aria-label="Sign in method"
            >
              {(['email', 'otp'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  className={cn(
                    'min-h-[44px] rounded-md text-sm font-semibold transition-colors',
                    mode === m
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  onClick={() => setMode(m)}
                >
                  {m === 'email' ? 'Email' : 'Phone OTP'}
                </button>
              ))}
            </div>
          ) : (
            <p className="mb-6 rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground">
              Use your work email and password. Phone OTP is for customer bookings only.
            </p>
          )}

          {mode === 'email' ? (
            <form onSubmit={onEmailSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              <form onSubmit={onOtpSend} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="otp-send-phone">Phone</Label>
                  <Input
                    id="otp-send-phone"
                    name="phone"
                    type="tel"
                    required
                    autoComplete="tel"
                    placeholder="+919876543210"
                  />
                </div>
                <Button type="submit" variant="outline" className="w-full" disabled={loading}>
                  {loading ? 'Sending…' : 'Send OTP'}
                </Button>
              </form>
              <form onSubmit={onOtpVerify} className="space-y-4 border-t border-border pt-6">
                <div className="grid gap-2">
                  <Label htmlFor="otp-phone">Phone</Label>
                  <Input
                    id="otp-phone"
                    name="phone"
                    type="tel"
                    required
                    defaultValue={otpPhone}
                    autoComplete="tel"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="otp-code">6-digit code</Label>
                  <Input
                    id="otp-code"
                    name="code"
                    type="text"
                    inputMode="numeric"
                    required
                    autoComplete="one-time-code"
                    placeholder="123456"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="otp-name">Your name (first time)</Label>
                  <Input id="otp-name" name="full_name" type="text" autoComplete="name" />
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? 'Verifying…' : 'Verify & sign in'}
                </Button>
              </form>
            </div>
          )}
        </AuthFormCard>
      </PublicShell>
      {loading ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 px-4">
          <WashhouseLoader size="md" label="Please wait…" />
        </div>
      ) : null}
    </div>
  );
}
