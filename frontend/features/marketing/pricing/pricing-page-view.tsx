import { loadMarketplaceFromItems } from '@/features/marketing/pricing/api/marketplace-from';
import { PricingCta } from '@/features/marketing/pricing/pricing-cta';
import { PricingHero } from '@/features/marketing/pricing/pricing-hero';
import { PricingHowItWorks } from '@/features/marketing/pricing/pricing-how-it-works';
import { PricingPageShell } from '@/features/marketing/pricing/pricing-page-shell';
import { PricingPriceGuide } from '@/features/marketing/pricing/pricing-price-guide';
import { PricingVarietyNote } from '@/features/marketing/pricing/pricing-variety-note';

export async function PricingPageView() {
  const items = await loadMarketplaceFromItems();

  return (
    <PricingPageShell>
      <PricingHero />
      <PricingHowItWorks />
      <PricingPriceGuide items={items} />
      <PricingVarietyNote />
      <PricingCta />
    </PricingPageShell>
  );
}
