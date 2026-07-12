'use client';

import { DiscoverHero } from '@/features/discover/marketplace/discover-hero';
import { HowItWorks } from '@/features/discover/marketplace/how-it-works';
import { MarketplaceCta } from '@/features/discover/marketplace/marketplace-cta';
import { MobileCtaBar } from '@/features/discover/marketplace/mobile-cta-bar';
import { MarketplacePageNav } from '@/features/discover/marketplace/page-nav';
import { PartnersSection } from '@/features/discover/marketplace/partners-section';
import { PricingSection } from '@/features/discover/marketplace/pricing-section';
import { ServiceCategories } from '@/features/discover/marketplace/service-categories';
import { StatsSection } from '@/features/discover/marketplace/stats-section';
import { Testimonials } from '@/features/discover/marketplace/testimonials';
import { WhyChooseUs } from '@/features/discover/marketplace/why-choose-us';

export function DiscoverMarketplace() {
  return (
    <div className="w-full">
      <MarketplacePageNav />
      <DiscoverHero />
      <MobileCtaBar />
      <div id="main-content" className="pb-20 sm:pb-0">
        <HowItWorks />
        <ServiceCategories />
        <WhyChooseUs />
        <PricingSection />
        <PartnersSection />
        <Testimonials />
        <StatsSection />
        <MarketplaceCta />
      </div>
    </div>
  );
}
