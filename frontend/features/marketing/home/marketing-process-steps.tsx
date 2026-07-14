import type { LucideIcon } from 'lucide-react';
import {
  ClipboardCheck,
  MessageCircle,
  PackageCheck,
  Sparkles,
  Truck,
} from 'lucide-react';

import { cn } from '@/lib/utils';

const PROCESS_STEPS = [
  { id: 'whatsapp', title: 'Book on WhatsApp', icon: MessageCircle },
  { id: 'pickup', title: 'We Pickup', icon: Truck },
  { id: 'cleaning', title: 'Cleaning Process', icon: Sparkles },
  { id: 'quality', title: 'Quality Check', icon: ClipboardCheck },
  { id: 'delivery', title: 'We Deliver', icon: PackageCheck },
] as const satisfies ReadonlyArray<{
  id: string;
  title: string;
  icon: LucideIcon;
}>;

type MarketingProcessStepsProps = {
  className?: string;
};

function StepIcon({ icon: Icon, step }: { icon: LucideIcon; step: number }) {
  return (
    <span
      className={cn(
        'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
        'border-2 border-primary/25 bg-primary/10 text-primary shadow-sm',
      )}
    >
      <Icon className="h-4 w-4" aria-hidden />
      <span className="sr-only">Step {step}</span>
    </span>
  );
}

export function MarketingProcessSteps({ className }: MarketingProcessStepsProps) {
  return (
    <div className={className}>
      {/* Mobile: vertical timeline with dashed connector */}
      <ol className="space-y-0 md:hidden" aria-label="How our laundry process works">
        {PROCESS_STEPS.map(({ id, title, icon }, index) => {
          const step = index + 1;
          const isLast = index === PROCESS_STEPS.length - 1;

          return (
            <li key={id} className="relative flex gap-4 pb-8 last:pb-0">
              {!isLast && (
                <span
                  className="absolute left-5 top-10 -ml-px h-[calc(100%-2.5rem)] border-l-2 border-dashed border-border"
                  aria-hidden
                />
              )}

              <StepIcon icon={icon} step={step} />

              <div className="min-w-0 pt-1.5">
                <p className="text-xs font-bold uppercase tracking-wide text-primary">
                  Step {step}
                </p>
                <p className="mt-0.5 text-base font-semibold text-foreground">{title}</p>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Desktop: horizontal stepper with dotted connectors */}
      <ol
        className="hidden items-start md:flex"
        aria-label="How our laundry process works"
      >
        {PROCESS_STEPS.map(({ id, title, icon }, index) => {
          const step = index + 1;
          const isLast = index === PROCESS_STEPS.length - 1;

          return (
            <li key={id} className="relative flex flex-1 flex-col items-center text-center">
              {!isLast && (
                <span
                  className="absolute left-[calc(50%+1.25rem)] top-5 h-0 w-[calc(100%-2.5rem)] border-t-2 border-dotted border-border"
                  aria-hidden
                />
              )}

              <StepIcon icon={icon} step={step} />

              <p className="mt-3 text-sm font-semibold leading-snug text-foreground">{title}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
