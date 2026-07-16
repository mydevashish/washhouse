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

const WhyChooseSection = dynamic(
  () =>
    import('@/features/marketing/home/why-choose-section').then((m) => ({
      default: m.WhyChooseSection,
    })),
  { loading: () => <section className="min-h-[24rem] bg-card" aria-hidden /> },
);

const StatsBand = dynamic(
  () =>
    import('@/features/marketing/home/stats-band').then((m) => ({
      default: m.StatsBand,
    })),
  { loading: () => <section className="min-h-[8rem] bg-brand-900/20" aria-hidden /> },
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

const FranchiseTeaser = dynamic(
  () =>
    import('@/features/marketing/home/franchise-teaser').then((m) => ({
      default: m.FranchiseTeaser,
    })),
  { loading: () => <section className="min-h-[20rem] bg-brand-900/20" aria-hidden /> },
);

const PartnerLoginStrip = dynamic(
  () =>
    import('@/features/marketing/home/partner-login-strip').then((m) => ({
      default: m.PartnerLoginStrip,
    })),
  { loading: () => <section className="min-h-[12rem] border-y border-border/60" aria-hidden /> },
);

const HomeTestimonials = dynamic(
  () =>
    import('@/features/discover/homepage/home-testimonials').then((m) => ({
      default: m.HomeTestimonials,
    })),
  { loading: () => <section className="min-h-[20rem] bg-card" aria-hidden /> },
);

const AppPromoSection = dynamic(
  () =>
    import('@/features/marketing/home/app-promo-section').then((m) => ({
      default: m.AppPromoSection,
    })),
  { loading: () => <section className="min-h-[24rem] bg-muted/30" aria-hidden /> },
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
    <div className="min-w-0 max-w-full overflow-x-hidden bg-background">
      <MarketingHomeHero />
      <StatsBand />
      <TrustStrip showOtpSubcopy />

      <HowItWorksSection />
      <WhyChooseSection />

      <ServicesPreview />
      <DeliveryOptionsBand />
      <FeaturedStoresTeaser />
      <FranchiseTeaser />
      <PartnerLoginStrip />
      <HomeTestimonials />
      <AppPromoSection />
      <FinalCtaBand />
    </div>
  );
}
