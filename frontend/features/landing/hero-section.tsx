'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

/** Marketing hero — R3F deferred; Framer Motion for v1 shell. */
export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 py-24 text-center">
      <motion.h1
        className="text-4xl font-bold tracking-tight sm:text-5xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Doorstep laundry, made effortless
      </motion.h1>
      <motion.p
        className="mx-auto mt-4 max-w-lg text-fg-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Discover nearby laundries, schedule pickup and delivery, and track every order in real time.
      </motion.p>
      <motion.div
        className="mt-8 flex flex-wrap justify-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
      >
        <Link
          href="/discover"
          className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-brand-600"
        >
          Find laundries
        </Link>
        <Link
          href="/register"
          className="rounded-md border border-border px-6 py-3 font-medium hover:bg-bg-1"
        >
          Get started
        </Link>
      </motion.div>
    </section>
  );
}
