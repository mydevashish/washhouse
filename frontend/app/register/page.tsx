'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { AuthFooterLink, AuthFormCard } from '@/components/auth/auth-form-card';
import { WashhouseLoader } from '@/components/brand/washhouse-loader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { register } from '@/services/auth';
import { useAuthStore } from '@/store/auth.store';

function safeNextPath(next: string | null): string | null {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return null;
  return next;
}

function loginHrefWithNext(next: string | null): string {
  const safe = safeNextPath(next);
  if (!safe) return '/login';
  return `/login?next=${encodeURIComponent(safe)}`;
}

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Create account · WashHouse';
  }, []);

  const signInHref = loginHrefWithNext(searchParams.get('next'));

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
      <AuthFormCard
        title="Create account"
        description="Sign up to book pickup, track orders, and save addresses."
        footer={
          <>
            <AuthFooterLink
              prompt="Already have an account?"
              href={signInHref}
              linkText="Sign in"
            />
            <p>
              <Link href="/staff" className="font-semibold text-primary hover:underline">
                Laundry or admin?
              </Link>
            </p>
          </>
        }
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
      {loading ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 px-4">
          <WashhouseLoader size="md" label="Please wait…" />
        </div>
      ) : null}
    </div>
  );
}
