'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type MarketingCarouselNavProps = {
  selectedIndex: number;
  slideCount: number;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (index: number) => void;
  getSlideControlId: (index: number) => string;
  prevLabel?: string;
  nextLabel?: string;
  dotsLabel?: string;
  getDotLabel?: (index: number) => string;
  className?: string;
  prevClassName?: string;
  nextClassName?: string;
  dotsClassName?: string;
};

const navButtonClassName =
  'h-11 w-11 rounded-full border-border/80 bg-background/90 shadow-soft backdrop-blur-sm transition-[opacity,transform] duration-base ease-out hover:bg-background active:scale-[0.98]';

const dotButtonClassName =
  'inline-flex h-11 w-11 items-center justify-center rounded-full transition-[opacity,transform] duration-base ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

const dotIndicatorClassName =
  'block rounded-full transition-[width,background-color] duration-base ease-out';

export function MarketingCarouselNav({
  selectedIndex,
  slideCount,
  onPrev,
  onNext,
  onSelect,
  getSlideControlId,
  prevLabel = 'Previous slide',
  nextLabel = 'Next slide',
  dotsLabel = 'Choose slide',
  getDotLabel,
  className,
  prevClassName,
  nextClassName,
  dotsClassName,
}: MarketingCarouselNavProps) {
  return (
    <div className={cn('flex items-center justify-center gap-4', className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={cn(navButtonClassName, prevClassName)}
        onClick={onPrev}
        aria-label={prevLabel}
      >
        <ChevronLeft className="h-5 w-5" aria-hidden />
      </Button>

      <div className={cn('flex gap-2', dotsClassName)} role="tablist" aria-label={dotsLabel}>
        {Array.from({ length: slideCount }).map((_, index) => (
          <button
            key={index}
            type="button"
            role="tab"
            aria-selected={selectedIndex === index}
            aria-controls={getSlideControlId(index)}
            className={dotButtonClassName}
            onClick={() => onSelect(index)}
            aria-label={getDotLabel?.(index) ?? `Go to slide ${index + 1}`}
          >
            <span
              aria-hidden
              className={cn(
                dotIndicatorClassName,
                selectedIndex === index
                  ? 'h-2.5 w-8 bg-primary'
                  : 'h-2.5 w-2.5 bg-muted-foreground/35 hover:bg-muted-foreground/55',
              )}
            />
          </button>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        className={cn(navButtonClassName, nextClassName)}
        onClick={onNext}
        aria-label={nextLabel}
      >
        <ChevronRight className="h-5 w-5" aria-hidden />
      </Button>
    </div>
  );
}
