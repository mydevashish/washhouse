import dynamic from 'next/dynamic';

import { TrustStrip } from '@/components/marketplace/trust-strip';
import { MarketingHomeHero } from '@/features/marketing/home/home-hero';

const HowItWorksSection = dynamic(
  () =>
    import('@/features/marketing/home/how-it-works-section').then((m) => ({
      default: m.HowItWorksSection,
    })),
  { loading: () => <section className="min-h-[24rem] bg-muted/30" aria-hidden /> },
);

const ServicesPreview = dynamic(
  () =>
    import('@/features/marketing/home/services-preview').then((m) => ({
      default: m.ServicesPreview,
    })),
  { loading: () => <section className="min-h-[24rem] bg-card" aria-hidden /> },
);

const DeliveryOptionsBand = dynamic(
  () =>
    import('@/features/marketing/home/delivery-options-band').then((m) => ({
      default: m.DeliveryOptionsBand,
    })),
  { loading: () => <section className="min-h-[20rem] border-y border-border/60" aria-hidden /> },
);

const FeaturedStoresTeaser = dynamic(
  () =>
    import('@/features/marketing/home/featured-stores-teaser').then((m) => ({
      default: m.FeaturedStoresTeaser,
    })),
  { loading: () => <section className="min-h-[24rem] bg-muted/30" aria-hidden /> },
);

const HomeTestimonials = dynamic(
  () =>
    import('@/features/discover/homepage/home-testimonials').then((m) => ({
      default: m.HomeTestimonials,
    })),
  { loading: () => <section className="min-h-[20rem] bg-card" aria-hidden /> },
);

const FinalCtaBand = dynamic(
  () =>
    import('@/features/marketing/home/final-cta-band').then((m) => ({
      default: m.FinalCtaBand,
    })),
  { loading: () => <section className="min-h-[16rem] bg-primary" aria-hidden /> },
);

export function MarketingHomepage() {
  return (
    <div className="overflow-x-hidden bg-background">
      <MarketingHomeHero />
      <TrustStrip />

      <HowItWorksSection />

      <ServicesPreview />
      <DeliveryOptionsBand />
      <FeaturedStoresTeaser />
      <HomeTestimonials />
      <FinalCtaBand />
    </div>
  );
}
