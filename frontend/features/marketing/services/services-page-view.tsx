import { ServicesCta } from '@/features/marketing/services/services-cta';
import { ServicesFaq } from '@/features/marketing/services/services-faq';
import { ServicesGrid } from '@/features/marketing/services/services-grid';
import { ServicesHero } from '@/features/marketing/services/services-hero';
import { ServicesPricing } from '@/features/marketing/services/services-pricing';

export function ServicesPageView() {
  return (
    <div className="bg-background">
      <ServicesHero />
      <ServicesGrid />
      <ServicesPricing />
      <ServicesFaq />
      <ServicesCta />
    </div>
  );
}
