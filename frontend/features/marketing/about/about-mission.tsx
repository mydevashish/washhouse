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
            We believe fresh clothes shouldn&apos;t cost you valuable time. Our mission is to make
            professional laundry simple, reliable, and accessible for everyone.
          </p>

          <p>
            The WashHouse connects customers with trusted laundry partners, making doorstep
            pickup and delivery easy. Book your service in minutes, and our team will coordinate
            the rest so you can focus on what matters most.
          </p>
        </div>
      </div>
    </section>
  );
}
