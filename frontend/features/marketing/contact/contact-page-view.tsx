import Link from 'next/link';
import {
  ArrowRight,
  Clock,
  HelpCircle,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Store,
} from 'lucide-react';

import { SectionHeader } from '@/components/marketplace/section-header';
import { Card, CardContent } from '@/components/ui/card';
import { BookNowCta } from '@/features/marketing/book-now';
import { ContactForm } from '@/features/marketing/contact/contact-form';
import {
  buildTelHref,
  buildWhatsAppHref,
  CONTACT_CONFIG,
} from '@/features/marketing/contact/contact-constants';

const QUICK_LINKS = [
  {
    href: '/services#faq',
    label: 'FAQ',
    description: 'Booking, pricing, and care questions',
    icon: HelpCircle,
  },
  // {
  //   href: '/orders',
  //   label: 'Track order',
  //   description: 'See live status on your pickups',
  //   icon: Package,
  // },
  {
    href: '/franchise',
    label: 'Partner with us',
    description: 'Open a WashHouse franchise',
    icon: Store,
  },
] as const;

function ContactHero() {
  return (
    <header className="border-b border-border bg-card py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-widest text-primary sm:text-sm">
          Contact
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl lg:text-5xl">
          We&apos;re here to help
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          Questions about an order, a store near you, or partnering with The WashHouse? Reach out —
          our team replies in plain English, not corporate speak.
        </p>
      </div>
    </header>
  );
}

function ContactChannels() {
  const whatsappHref = buildWhatsAppHref(
    CONTACT_CONFIG.whatsapp,
    'Hi WashHouse — I have a question.',
  );

  const channels = [
    {
      id: 'email',
      icon: Mail,
      label: 'Support email',
      value: CONTACT_CONFIG.supportEmail,
      href: `mailto:${CONTACT_CONFIG.supportEmail}`,
      external: false,
    },
    {
      id: 'phone',
      icon: Phone,
      label: 'Phone',
      value: CONTACT_CONFIG.phone,
      href: buildTelHref(CONTACT_CONFIG.phone),
      external: false,
    },
    {
      id: 'whatsapp',
      icon: MessageCircle,
      label: 'WhatsApp',
      value: CONTACT_CONFIG.whatsapp,
      href: whatsappHref,
      external: true,
    },
    {
      id: 'hours',
      icon: Clock,
      label: 'Business hours (IST)',
      value: CONTACT_CONFIG.businessHours,
      href: undefined,
      external: false,
    },
  ] as const;

  return (
    <section aria-labelledby="contact-channels-title" className="border-b border-border bg-muted/30 py-10 sm:py-12">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Reach us"
          title="Pick what works for you"
          description="Email, call, or WhatsApp — we're on IST business hours."
          align="center"
          className="mb-8"
        />

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {channels.map(({ id, icon: Icon, label, value, href, external }) => (
            <li key={id}>
              <Card variant="elevated" className="h-full">
                <CardContent className="flex h-full flex-col gap-3 p-4 sm:p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{label}</p>
                    {href ? (
                      <a
                        href={href}
                        className="mt-1 inline-block text-sm text-primary underline-offset-4 hover:underline"
                        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      >
                        {value}
                      </a>
                    ) : (
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{value}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function QuickLinks() {
  return (
    <nav aria-labelledby="contact-quick-links-title">
      <h2 id="contact-quick-links-title" className="text-lg font-bold text-foreground">
        Quick links
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Skip the wait — try these first.</p>
      <ul className="mt-4 space-y-3">
        {QUICK_LINKS.map(({ href, label, description, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="group flex min-h-[44px] items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/30 hover:bg-muted/40"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground group-hover:text-primary">
                  {label}
                </span>
                <span className="block text-xs text-muted-foreground">{description}</span>
              </span>
              <ArrowRight
                className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function OfficeAddress() {
  const lines = CONTACT_CONFIG.officeAddress.split('\n').filter(Boolean);

  return (
    <address className="not-italic">
      <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
        <MapPin className="h-5 w-5 text-primary" aria-hidden />
        Office
      </h2>
      <Card variant="default" className="mt-4">
        <CardContent className="space-y-1 p-4 text-sm leading-relaxed text-muted-foreground">
          {lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </CardContent>
      </Card>
    </address>
  );
}

export function ContactPageView({ defaultSubject }: { defaultSubject?: 'general' | 'order-help' | 'franchise' | 'legal-privacy' }) {
  return (
    <div className="bg-background">
      <ContactHero />
      <ContactChannels />

      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-5 lg:gap-12">
            <div className="lg:col-span-3">
              <ContactForm
                key={defaultSubject ?? 'general'}
                defaultSubject={defaultSubject}
              />
            </div>

            <aside className="space-y-10 lg:col-span-2">
              <QuickLinks />
              <OfficeAddress />

              <div className="rounded-xl border border-border bg-muted/30 p-4 sm:p-5">
                <p className="text-sm font-semibold text-foreground">Prefer to book instead?</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Find a verified laundry near you and schedule pickup in minutes.
                </p>
                <BookNowCta className="mt-4 h-11 w-full rounded-full sm:w-auto">
                  Book a pickup
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </BookNowCta>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
