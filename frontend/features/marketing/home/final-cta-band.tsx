'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { FadeIn, FadeInItem } from '@/features/discover/marketplace/fade-in';

export function FinalCtaBand() {
  const reduce = useReducedMotion();

  return (
    <section aria-labelledby="final-cta-title" className="bg-primary py-12 sm:py-16">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <FadeInItem>
            <motion.div
              className="mx-auto max-w-2xl text-center"
              initial={reduce ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2
                id="final-cta-title"
                className="text-2xl font-bold tracking-tight text-primary-foreground sm:text-3xl"
              >
                Ready for fresh clothes?
              </h2>
              <p className="mt-3 text-base leading-relaxed text-primary-foreground/85 sm:text-lg">
                Pick a laundry, schedule pickup, and we&apos;ll handle the rest. UPI, COD, and GST
                included at checkout.
              </p>
              <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                <Button
                  asChild
                  size="lg"
                  className="h-11 w-full rounded-full bg-card text-primary hover:bg-card/95 sm:w-auto"
                >
                  <Link href="/discover#laundries">
                    Schedule my pickup
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-11 w-full rounded-full border-2 border-primary-foreground/70 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 sm:w-auto"
                >
                  <Link href="/franchise">Partner with us</Link>
                </Button>
              </div>
            </motion.div>
          </FadeInItem>
        </FadeIn>
      </div>
    </section>
  );
}
