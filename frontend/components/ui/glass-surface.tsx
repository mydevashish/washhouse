import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';

import { cn } from '@/lib/utils';

export type GlassSurfaceProps = React.HTMLAttributes<HTMLDivElement> & {
  asChild?: boolean;
  variant?: 'default' | 'strong' | 'subtle' | 'onDark';
};

const variantClass: Record<NonNullable<GlassSurfaceProps['variant']>, string> = {
  default: 'glass-surface',
  strong: 'glass-surface glass-surface--strong',
  subtle: 'glass-surface glass-surface--subtle',
  /** Dark glass over photos/gradients — never pairs with --strong (avoids white card + text-on-hero clash) */
  onDark: 'glass-surface glass-surface--on-dark',
};

export const GlassSurface = React.forwardRef<HTMLDivElement, GlassSurfaceProps>(
  ({ className, variant = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'div';
    return (
      <Comp ref={ref} className={cn(variantClass[variant], className)} {...props} />
    );
  },
);
GlassSurface.displayName = 'GlassSurface';
