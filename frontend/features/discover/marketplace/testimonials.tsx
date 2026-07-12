'use client';

import Image from 'next/image';
import { Star } from 'lucide-react';

import { FadeIn, FadeInItem } from '@/features/discover/marketplace/fade-in';
import { Section, SectionHeading } from '@/features/discover/marketplace/section';

const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    location: 'Koramangala, Bengaluru',
    rating: 5,
    text: 'Pickup was on time and my clothes came back smelling fresh. Tracking in the app made the whole process stress-free.',
    image:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Rahul Menon',
    location: 'Indiranagar, Bengaluru',
    rating: 5,
    text: 'Perfect for busy weeks — affordable rates and the partner handled my formal shirts better than my old dhobi.',
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Ananya Iyer',
    location: 'HSR Layout, Bengaluru',
    rating: 4,
    text: 'Express service saved me before a trip. Doorstep delivery is a game changer for our family of four.',
    image:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
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
                  <div className="relative h-12 w-12 overflow-hidden rounded-full ring-2 ring-brand-50 dark:ring-brand-900/50">
                    <Image src={t.image} alt="" fill className="object-cover" sizes="48px" />
                  </div>
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
