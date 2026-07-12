import { BadgeCheck, Clock, ShieldCheck, Sparkles, Truck } from 'lucide-react';

const ITEMS = [
  { icon: BadgeCheck, label: 'Verified laundries' },
  { icon: Truck, label: 'Free pickup' },
  { icon: Clock, label: 'Express delivery' },
  { icon: ShieldCheck, label: 'Quality checked' },
  { icon: Sparkles, label: 'Fresh & clean' },
] as const;

export function TrustStrip({ className = '' }: { className?: string }) {
  return (
    <div
      className={`overflow-hidden border-y border-border/60 bg-card ${className}`}
      role="region"
      aria-label="Trust indicators"
    >
      <ul className="mx-auto flex max-w-7xl gap-6 overflow-x-auto px-4 py-4 scrollbar-none sm:justify-center sm:gap-10 sm:px-6">
        {ITEMS.map(({ icon: Icon, label }) => (
          <li
            key={label}
            className="flex shrink-0 items-center gap-2 text-sm font-medium text-foreground"
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
