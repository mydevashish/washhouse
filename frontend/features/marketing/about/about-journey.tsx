import { SectionHeader } from '@/components/marketplace/section-header';

const MILESTONES = [
  {
    year: '2023',
    title: 'The idea takes shape',
    description:
      'Founded in Bengaluru with a small team who believed doorstep laundry deserved the same polish as food delivery.',
  },
  {
    year: '2024',
    title: 'Marketplace launch',
    description:
      'Opened The WashHouse to customers and partner stores — verified laundries, live tracking, and UPI checkout from day one.',
  },
  {
    year: '2025',
    title: 'Growing across India',
    description:
      'Expanding into more cities, onboarding neighbourhood favourites, and building subscription plans for regular customers.',
  },
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
