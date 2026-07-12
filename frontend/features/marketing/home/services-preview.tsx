'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import { SectionHeader } from '@/components/marketplace/section-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FadeIn, FadeInItem } from '@/features/discover/marketplace/fade-in';
import { SERVICE_PREVIEW_ITEMS } from '@/features/marketing/home/services-data';

export function ServicesPreview() {
  const reduce = useReducedMotion();

  return (
    <section aria-labelledby="services-preview-title" className="bg-card py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <FadeInItem>
            <SectionHeader
              eyebrow="Services"
              title="Everything your wardrobe needs"
              description="From everyday wash & fold to express dry cleaning — pick what fits your week."
              align="center"
              className="mb-10"
            />
          </FadeInItem>

          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {SERVICE_PREVIEW_ITEMS.map(({ id, title, description, icon: Icon, accent }) => (
              <FadeInItem key={id}>
                <li>
                  <motion.article
                    className="h-full"
                    whileHover={reduce ? undefined : { y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="h-full rounded-2xl border-0 shadow-soft ring-1 ring-border/60 transition-shadow hover:shadow-[var(--shadow-card-hover)]">
                      <CardContent className="flex h-full flex-col p-6">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent}`}
                        >
                          <Icon className="h-5 w-5" aria-hidden />
                        </div>
                        <h3 className="mt-4 text-lg font-bold text-foreground">{title}</h3>
                        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                          {description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.article>
                </li>
              </FadeInItem>
            ))}
          </ul>

          <FadeInItem>
            <div className="mt-10 flex justify-center">
              <Button asChild variant="outline" size="lg" className="rounded-full">
                <Link href="/services">
                  View all services
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </FadeInItem>
        </FadeIn>
      </div>
    </section>
  );
}
