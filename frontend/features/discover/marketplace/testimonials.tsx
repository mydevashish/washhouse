'use client';

import { Star } from 'lucide-react';

import { FadeIn, FadeInItem } from '@/features/discover/marketplace/fade-in';
import { Section, SectionHeading } from '@/features/discover/marketplace/section';
import { TestimonialAvatar } from '@/features/marketing/testimonials/testimonial-avatar';

const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    location: 'Koramangala, Bengaluru',
    rating: 5,
    text: 'Pickup was on time and my clothes came back smelling fresh. Tracking in the app made the whole process stress-free.',
  },
  {
    name: 'Rahul Menon',
    location: 'Indiranagar, Bengaluru',
    rating: 5,
    text: 'Perfect for busy weeks — affordable rates and the partner handled my formal shirts better than my old dhobi.',
  },
  {
    name: 'Ananya Iyer',
    location: 'HSR Layout, Bengaluru',
    rating: 4,
    text: 'Express service saved me before a trip. Doorstep delivery is a game changer for our family of four.',
  },
] as const;

export function Testimonials() {
  return (
    <Section id="testimonials" tone="muted" ariaLabel="Customer testimonials">
      <FadeIn>
        <FadeInItem>
          <SectionHeading
            eyebrow="Reviews"
            title="Trusted by thousands"
            description="Real feedback from customers who use DLM for everyday laundry and special occasions."
          />
        </FadeInItem>
        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <FadeInItem key={t.name}>
              <article className="flex h-full flex-col rounded-2xl border border-border bg-bg-0 p-6 shadow-soft sm:p-8">
                <div className="flex items-center gap-3">
                  <TestimonialAvatar name={t.name} />
                  <div>
                    <p className="font-semibold text-fg-0">{t.name}</p>
                    <p className="text-xs text-fg-2">{t.location}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-0.5" role="img" aria-label={`${t.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${i < t.rating ? 'fill-rating text-rating' : 'text-border'}`}
                      aria-hidden
                    />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-fg-1 sm:text-base">
                  &ldquo;{t.text}&rdquo;
                </blockquote>
              </article>
            </FadeInItem>
          ))}
        </div>
      </FadeIn>
    </Section>
  );
}
