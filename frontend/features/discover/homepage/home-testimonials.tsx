import Image from 'next/image';
import { Quote, Star } from 'lucide-react';

import { SectionHeader } from '@/components/marketplace/section-header';
import { Card, CardContent } from '@/components/ui/card';

const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    location: 'Koramangala',
    rating: 5,
    text: 'I pick a laundry on DLM, choose wash & fold, and they handle the rest. Pickup was on time every week.',
    image:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Rahul Menon',
    location: 'Indiranagar',
    rating: 5,
    text: 'Love that I compare stores first. Found a partner with great ratings and transparent pricing.',
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Ananya Iyer',
    location: 'HSR Layout',
    rating: 5,
    text: 'Free pickup and delivery sold me. The app makes it easy to track when clothes are on the way back.',
    image:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
  },
] as const;

export function HomeTestimonials() {
  return (
    <section
      aria-labelledby="testimonials-title"
      className="border-t border-border bg-surface-gradient py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Reviews"
          title="Loved by customers"
          description="Real stories from people who book professional laundry through DLM."
          align="center"
          className="mb-12"
        />

        <ul className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <li key={t.name}>
              <Card className="relative h-full overflow-hidden rounded-2xl border-0 shadow-soft ring-1 ring-border/60 transition-shadow hover:shadow-[var(--shadow-card-hover)]">
                <CardContent className="p-6 sm:p-8">
                  <Quote
                    className="absolute right-6 top-6 h-8 w-8 text-primary/10"
                    aria-hidden
                  />
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-full ring-2 ring-primary/20">
                      <Image src={t.image} alt="" fill className="object-cover" sizes="48px" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.location}</p>
                    </div>
                  </div>
                  <div
                    className="mt-4 flex gap-0.5"
                    role="img"
                    aria-label={`${t.rating} out of 5 stars`}
                  >
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-3.5 w-3.5 fill-rating text-rating"
                        aria-hidden
                      />
                    ))}
                  </div>
                  <blockquote className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    &ldquo;{t.text}&rdquo;
                  </blockquote>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
