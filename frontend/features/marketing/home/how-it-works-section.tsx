import { BookingFlowSteps } from '@/components/marketplace/booking-flow-steps';
import { SectionHeader } from '@/components/marketplace/section-header';
import { GlassSurface } from '@/components/ui/glass-surface';
import { cn } from '@/lib/utils';

export function HowItWorksSection() {
  return (
    <section
      aria-labelledby="how-it-works-title"
      className="bg-muted/30 py-12 sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="How it works"
          title="Book in 4 simple steps"
          description="No confusion — pick a laundry, add services, schedule pickup, and track until delivery."
          align="center"
          className="mb-10"
        />
        <GlassSurface
          variant="subtle"
          className={cn(
            'rounded-2xl',
            'max-md:border-0 max-md:bg-transparent max-md:p-0 max-md:[backdrop-filter:none] max-md:[-webkit-backdrop-filter:none]',
            'md:p-6 lg:p-8',
          )}
        >
          <BookingFlowSteps />
        </GlassSurface>
      </div>
    </section>
  );
}
