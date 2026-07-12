'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { AuthFooterLink, AuthFormCard } from '@/components/auth/auth-form-card';
import { WashhouseLoader } from '@/components/brand/washhouse-loader';
import { WashhouseLogo } from '@/components/brand/washhouse-logo';
import { PublicShell } from '@/components/layout/public-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { register } from '@/services/auth';
import { useAuthStore } from '@/store/auth.store';

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    try {
      const result = await register({
        email: String(fd.get('email')),
        password: String(fd.get('password')),
        full_name: String(fd.get('full_name')),
      });
      setUser(result.user);
      setAccessToken(result.tokens.access_token);
      toast.success('Account created — welcome!');
      router.push('/discover');
    } catch {
      toast.error('Could not create account — email may already be in use');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div aria-busy={loading || undefined}>
      <PublicShell showBack={false}>
        <div className="mx-auto flex w-full max-w-md justify-center px-4 pt-10 sm:px-0">
          <div className="inline-flex max-w-full justify-center rounded-md p-1.5 dark:bg-white/90">
            <WashhouseLogo href="/discover" priority adaptive={false} />
          </div>
        </div>
        <AuthFormCard
          className="min-h-0 justify-start pt-4"
          title="Create account"
          description="Sign up to book pickup, track orders, and save addresses."
          footer={<AuthFooterLink prompt="Already have an account?" href="/login" linkText="Sign in" />}
        >
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="reg-name">Full name</Label>
              <Input id="reg-name" name="full_name" required autoComplete="name" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reg-email">Email</Label>
              <Input id="reg-email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reg-password">Password</Label>
              <Input
                id="reg-password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="At least 8 characters"
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Creating account…' : 'Sign up'}
            </Button>
          </form>
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
