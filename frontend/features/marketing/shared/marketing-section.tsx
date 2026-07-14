import type { ReactNode } from 'react';

import { SectionHeader } from '@/components/marketplace/section-header';
import {
  MARKETING_CONTAINER,
  MARKETING_SECTION_PY,
} from '@/features/marketing/shared/marketing-layout';
import { cn } from '@/lib/utils';

export type MarketingSectionHeader = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
};

export type MarketingSectionProps = {
  id?: string;
  'aria-labelledby'?: string;
  /** Applies `bg-muted/30` for alternating marketing bands */
  alternate?: boolean;
  className?: string;
  containerClassName?: string;
  header?: MarketingSectionHeader;
  children: ReactNode;
};

export function MarketingSection({
  id,
  'aria-labelledby': ariaLabelledBy,
  alternate = false,
  className,
  containerClassName,
  header,
  children,
}: MarketingSectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={cn(
        MARKETING_SECTION_PY,
        alternate ? 'bg-muted/30' : undefined,
        className,
      )}
    >
      <div className={cn(MARKETING_CONTAINER, containerClassName)}>
        {header ? (
          <SectionHeader
            eyebrow={header.eyebrow}
            title={header.title}
            description={header.description}
            align={header.align}
            className={cn('mb-10', header.className)}
          />
        ) : null}
        {children}
      </div>
    </section>
  );
}
