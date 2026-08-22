import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

export const inputVariants = cva(
  [
    'flex w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm text-foreground shadow-sm',
    'transition-colors duration-base placeholder:text-muted-foreground',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'file:border-0 file:bg-transparent file:text-sm file:font-medium',
    'h-control min-h-[44px] sm:min-h-0',
  ].join(' '),
  {
    variants: {
      variant: {
        default: '',
        error: 'border-destructive focus-visible:ring-destructive',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> &
  VariantProps<typeof inputVariants>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', variant, onKeyDown, onWheel, inputMode, ...props }, ref) => {
    const isNumericInput = type === 'number';

    const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
      if (isNumericInput) {
        if (['ArrowUp', 'ArrowDown', 'e', 'E', '+', '-'].includes(event.key)) {
          event.preventDefault();
        }
      }
      onKeyDown?.(event);
    };

    const handleWheel: React.WheelEventHandler<HTMLInputElement> = (event) => {
      if (isNumericInput) {
        event.preventDefault();
      }
      onWheel?.(event);
    };

    return (
      <input
        {...props}
        type={isNumericInput ? 'text' : type}
        inputMode={isNumericInput ? 'numeric' : inputMode}
        pattern={isNumericInput ? '[0-9]*' : props.pattern}
        onKeyDown={handleKeyDown}
        onWheel={handleWheel}
        className={cn(
          inputVariants({ variant }),
          isNumericInput && 'appearance-none [moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
          className,
        )}
        ref={ref}
      />
    );
  },
);
Input.displayName = 'Input';
