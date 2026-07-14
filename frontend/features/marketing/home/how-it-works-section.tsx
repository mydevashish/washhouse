import { SectionHeader } from '@/components/marketplace/section-header';
import { GlassSurface } from '@/components/ui/glass-surface';
import { MarketingProcessSteps } from '@/features/marketing/home/marketing-process-steps';
import {
  GLASS_MOBILE_TRANSPARENT,
  MARKETING_CONTAINER,
  MARKETING_SECTION_PY,
} from '@/features/marketing/shared/marketing-layout';
import { cn } from '@/lib/utils';

export function HowItWorksSection() {
  return (
    <section
      aria-labelledby="how-it-works-title"
      className={cn('bg-muted/30', MARKETING_SECTION_PY)}
    >
      <div className={MARKETING_CONTAINER}>
        <SectionHeader
          title="How It Works"
          description="Simple steps for a hassle-free experience"
          align="center"
          className="mb-10"
        />
        <GlassSurface
          variant="subtle"
          className={cn(
            'rounded-2xl',
            GLASS_MOBILE_TRANSPARENT,
            'md:p-6 lg:p-8',
          )}
        >
          <MarketingProcessSteps />
        </GlassSurface>
      </div>
    </section>
  );
}
