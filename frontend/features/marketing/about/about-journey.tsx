import { SectionHeader } from '@/components/marketplace/section-header';

const MILESTONES = [
  {
    year: '2025',
    title: 'The Idea Was Born',
    description:
      'The WashHouse was founded by three friends from Madhya Pradesh with a shared vision of building a modern, technology-driven laundry brand focused on quality, convenience, and customer satisfaction.',
  },
  {
    year: '2026',
    title: 'Our First Laundry in Udaipur',
    description:
      'We launched our first WashHouse laundry facility in Udaipur, Rajasthan, offering professional garment care, doorstep pickup and delivery, and a simple booking experience.',
  },
  {
    year: 'Future',
    title: 'Building the WashHouse Network',
    description:
      'Our vision is to expand across India by opening WashHouse stores and welcoming franchise partners who share our commitment to quality, innovation, and customer-first service.',
  }
] as const;

export function AboutJourney() {
  return (
    <section
      aria-labelledby="about-journey-title"
      className="border-t border-border bg-card py-12 sm:py-16"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Our journey"
          title="From one city to a nationwide marketplace"
          align="center"
          className="mb-10"
        />

        <ol className="relative space-y-8 border-l-2 border-primary/20 pl-8 sm:pl-10">
          {MILESTONES.map(({ year, title, description }) => (
            <li key={year} className="relative">
              <span
                className="absolute -left-[calc(2rem+5px)] top-1 flex h-3 w-3 rounded-full bg-primary ring-4 ring-card sm:-left-[calc(2.5rem+5px)]"
                aria-hidden
              />
              <p className="text-sm font-bold uppercase tracking-widest text-primary">{year}</p>
              <h3 className="mt-1 text-lg font-bold text-foreground">{title}</h3>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">{description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
