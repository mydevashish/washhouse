// Template: React component (replace <Name> + path)
// Save as: frontend/components/ui/<name>.tsx  OR  frontend/features/<f>/components/<name>.tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type <Name>Variant = 'default' | 'secondary' | 'ghost';

export interface <Name>Props extends React.HTMLAttributes<HTMLDivElement> {
  variant?: <Name>Variant;
  isLoading?: boolean;
}

export const <Name> = React.forwardRef<HTMLDivElement, <Name>Props>(
  ({ className, variant = 'default', isLoading, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-loading={isLoading || undefined}
        className={cn(
          'inline-flex items-center justify-center rounded-md transition-colors',
          variant === 'default'   && 'bg-brand-500 text-white hover:bg-brand-600',
          variant === 'secondary' && 'bg-bg-2 text-fg-0 hover:bg-bg-1',
          variant === 'ghost'     && 'bg-transparent hover:bg-bg-1',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
<Name>.displayName = '<Name>';
