import { BadgeCheck, Clock, ShieldCheck, Smartphone, Sparkles, Truck } from 'lucide-react';

import { cn } from '@/lib/utils';

const ITEMS = [
  { icon: BadgeCheck, label: 'Verified laundries' },
  { icon: Truck, label: 'Free pickup' },
  { icon: Clock, label: 'Express delivery' },
  { icon: ShieldCheck, label: 'Quality checked' },
  { icon: Sparkles, label: 'Fresh & clean' },
] as const;

const OTP_SUBCOPY = 'Sign in with phone OTP · No account needed to browse stores';

type TrustStripProps = {
  className?: string;
  /** Muted pill above trust items — used on marketing homepage fold */
  showOtpSubcopy?: boolean;
};

export function TrustStrip({ className, showOtpSubcopy = false }: TrustStripProps) {
  return (
    <div
      className={cn(
        'overflow-hidden border-y border-border/60 bg-card',
        showOtpSubcopy && 'border-t-0',
        className,
      )}
      role="region"
      aria-label="Trust indicators"
    >
      {showOtpSubcopy ? (
        <p className="flex justify-center border-b border-border/50 bg-muted/20 px-4 py-2 sm:py-2.5">
          <span className="inline-flex max-w-xl items-center gap-1.5 rounded-full border border-border/50 bg-background/90 px-3 py-1 text-center text-[0.6875rem] leading-snug text-muted-foreground shadow-soft sm:gap-2 sm:px-3.5 sm:py-1.5 sm:text-xs">
            <Smartphone className="h-3.5 w-3.5 shrink-0 text-primary/70" aria-hidden />
            {OTP_SUBCOPY}
          </span>
        </p>
      ) : null}
      <ul className="mx-auto flex max-w-7xl flex-wrap justify-center gap-4 px-4 py-3 sm:gap-6 sm:px-6 sm:py-4 lg:gap-10">
        {ITEMS.map(({ icon: Icon, label }) => (
          <li
            key={label}
            className="flex items-center gap-2 text-sm font-medium text-foreground"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
