const STATS = [
  { value: '12+', label: 'Cities served' },
  { value: '150+', label: 'Partner stores' },
  { value: '25K+', label: 'Orders delivered' },
  { value: '4.7', label: 'Average rating' },
] as const;

export function AboutStats() {
  return (
    <section aria-labelledby="about-stats-title" className="border-b border-border bg-background py-10 sm:py-12">
      <h2 id="about-stats-title" className="sr-only">
        Our impact in numbers
      </h2>
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <ul className="grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-8">
          {STATS.map(({ value, label }) => (
            <li key={label} className="text-center">
              <p className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">{value}</p>
              <p className="mt-1 text-sm font-medium text-muted-foreground sm:text-base">{label}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
