import { cn } from '@/lib/utils';

type SectionProps = {
  id?: string;
  className?: string;
  children: React.ReactNode;
  tone?: 'default' | 'muted' | 'brand';
  ariaLabel?: string;
};

const tones = {
  default: 'bg-bg-0',
  muted: 'bg-bg-1',
  brand:
    'bg-gradient-to-b from-brand-50/60 via-bg-0 to-bg-0 dark:from-brand-900/20 dark:via-bg-0 dark:to-bg-0',
};

export function Section({ id, className, children, tone = 'default', ariaLabel }: SectionProps) {
  return (
    <section
      id={id}
      aria-label={ariaLabel}
      className={cn('py-16 sm:py-20 lg:py-24', tones[tone], className)}
    >
      <div className="container">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  helper,
  align = 'center',
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  helper?: string;
  align?: 'center' | 'left';
}) {
  return (
    <header
      className={cn(
        'mb-10 max-w-3xl sm:mb-12 lg:mb-14',
        align === 'center' && 'mx-auto text-center',
      )}
    >
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-500 sm:text-sm">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-fg-0 sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-base leading-relaxed text-fg-1 sm:mt-4 sm:text-lg">{description}</p>
      )}
      {helper && (
        <p className="mt-2 text-sm text-fg-2 sm:text-base">{helper}</p>
      )}
    </header>
  );
}
