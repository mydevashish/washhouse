import { SectionHeader } from '@/components/marketplace/section-header';

export function AboutMission() {
  return (
    <section aria-labelledby="about-mission-title" className="bg-background py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Our mission"
          title="Professional laundry, made effortless"
          className="mb-6"
        />
        <div className="space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg [&_p+p]:mt-4">
          <p>
            We believe fresh clothes shouldn&apos;t cost you a morning. Our mission is to make
            professional laundry effortless, transparent, and trustworthy — for students, young
            professionals, and families across India.
          </p>
          <p>
            Every partner on The WashHouse is verified. Every price includes GST upfront. And every
            order can be paid your way — UPI or cash on delivery. No hidden fees, no guesswork.
          </p>
        </div>
      </div>
    </section>
  );
}
