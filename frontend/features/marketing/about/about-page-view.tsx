import { AboutCta } from '@/features/marketing/about/about-cta';
import { AboutDifferentiators } from '@/features/marketing/about/about-differentiators';
import { AboutHero } from '@/features/marketing/about/about-hero';
import { AboutJourney } from '@/features/marketing/about/about-journey';
import { AboutMission } from '@/features/marketing/about/about-mission';
import { AboutStats } from '@/features/marketing/about/about-stats';
import { AboutValues } from '@/features/marketing/about/about-values';

export function AboutPageView() {
  return (
    <div className="bg-background">
      <AboutHero />
      {/* <AboutStats /> */}
      <AboutMission />
      <AboutDifferentiators />
      <AboutValues />
      <AboutJourney />
      <AboutCta />
    </div>
  );
}
