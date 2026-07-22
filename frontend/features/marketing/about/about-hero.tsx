export function AboutHero() {
  return (
    <header className="border-b border-border bg-card py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-widest text-primary sm:text-sm">About us</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl lg:text-5xl">
          Laundry that fits your life — not the other way around
        </h1>
        <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg [&_p+p]:mt-4">
          <p>
            The WashHouse started with a simple frustration: professional laundry in India still
            feels like a chore. Long waits, unclear pricing, and no way to know when your clothes
            will actually come back.
          </p>
          <p>
            We built a modern doorstep laundry marketplace where you can discover trusted laundry partners,
            schedule a pickup in minutes, and get your clothes professionally cleaned and delivered back to
            your doorstep. Booking is quick, and our team confirms every order via WhatsApp or phone.
          </p>
        </div>
      </div>
    </header>
  );
}
