'use client';

import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type AuthFormCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

/**
 * Auth card under MarketingShell — avoid full-viewport min-height (shell already
 * owns min-h-screen + sticky-nav + mobile sticky-CTA padding).
 */
export function AuthFormCard({ title, description, children, footer, className }: AuthFormCardProps) {
  return (
    <div
      className={cn(
        'mx-auto flex w-full max-w-md flex-col justify-center px-4 py-8 sm:py-10 lg:py-14',
        className,
      )}
    >
      <Card className="shadow-pop">
        <CardHeader className="space-y-1 text-center sm:text-left">
          <CardTitle className="text-2xl">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
      {footer && <div className="mt-6 space-y-3 text-center text-sm text-muted-foreground">{footer}</div>}
    </div>
  );
}

export function AuthFooterLink({
  prompt,
  href,
  linkText,
}: {
  prompt: string;
  href: string;
  linkText: string;
}) {
  return (
    <p>
      {prompt}{' '}
      <Link href={href} className="font-semibold text-primary hover:underline">
        {linkText}
      </Link>
    </p>
  );
}
