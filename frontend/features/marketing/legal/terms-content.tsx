import Link from 'next/link';

import { WASHHOUSE_BRAND_NAME } from '@/components/brand/washhouse-logo';

import { LEGAL_LAST_UPDATED } from '@/features/marketing/legal/legal-constants';
import { LegalSection } from '@/features/marketing/legal/legal-section';

const TOC_SECTIONS = [
  { id: 'introduction', title: 'Introduction & acceptance' },
  { id: 'definitions', title: 'Definitions' },
  { id: 'account', title: 'Account registration & eligibility' },
  { id: 'booking', title: 'Booking, pickup & delivery' },
  { id: 'pricing', title: 'Pricing, GST & invoices' },
  { id: 'payments', title: 'Payments' },
  { id: 'cancellations', title: 'Cancellations & refunds' },
  { id: 'marketplace-role', title: 'Partner responsibility & platform role' },
  { id: 'conduct', title: 'User conduct & prohibited use' },
  { id: 'reviews', title: 'Reviews & content' },
  { id: 'liability', title: 'Limitation of liability' },
  { id: 'disputes', title: 'Dispute resolution & governing law' },
  { id: 'changes', title: 'Changes to these terms' },
  { id: 'contact', title: 'Contact for legal queries' },
] as const;

export function TermsContent() {
  return (
    <article className="bg-background">
      <header className="border-b border-border bg-card py-10 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div
            className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm leading-relaxed text-foreground sm:px-5"
            role="note"
          >
            <p className="font-semibold">Important — not legal advice</p>
            <p className="mt-1 text-muted-foreground">
              These Terms &amp; Conditions are provided in plain English for transparency. They are
              a template and must be reviewed by qualified legal counsel before production use.
            </p>
          </div>

          <p className="mt-6 text-xs font-bold uppercase tracking-widest text-primary sm:text-sm">
            Legal
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl">
            Terms &amp; Conditions
          </h1>
          <p className="mt-4 text-sm text-muted-foreground sm:text-base">
            Last updated: {LEGAL_LAST_UPDATED}
          </p>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            These terms govern your use of {WASHHOUSE_BRAND_NAME} and the Doorstep Laundry
            Marketplace (DLM) platform in India. By creating an account, placing an order, or using
            our services, you agree to them.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="lg:grid lg:grid-cols-[minmax(0,16rem)_1fr] lg:gap-12 xl:gap-16">
          <nav
            aria-label="Table of contents"
            className="mb-10 lg:sticky lg:top-24 lg:mb-0 lg:self-start"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              On this page
            </p>
            <ol className="mt-3 space-y-1 text-sm">
              {TOC_SECTIONS.map(({ id, title }, index) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="block rounded-md px-2 py-2 font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <span className="sr-only">Section {index + 1}: </span>
                    {title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="min-w-0 max-w-3xl">
            <LegalSection id="introduction" title="1. Introduction & acceptance">
              <p>
                Welcome to {WASHHOUSE_BRAND_NAME} (&quot;WashHouse&quot;, &quot;we&quot;,
                &quot;us&quot;). We operate a technology platform that connects customers with
                independent laundry and dry-cleaning partners (&quot;Partners&quot; or
                &quot;Stores&quot;) for doorstep pickup, processing, and delivery across India.
              </p>
              <p>
                By accessing our website or mobile experience, registering, or placing an Order, you
                confirm that you have read, understood, and agree to these Terms &amp; Conditions
                and our related policies. If you do not agree, please do not use the Platform.
              </p>
            </LegalSection>

            <LegalSection id="definitions" title="2. Definitions">
              <ul>
                <li>
                  <strong className="text-foreground">Customer</strong> — an individual who books
                  laundry or dry-cleaning services through the Platform.
                </li>
                <li>
                  <strong className="text-foreground">Partner / Store</strong> — an independent
                  laundry business registered on the Platform to fulfil Orders.
                </li>
                <li>
                  <strong className="text-foreground">Platform</strong> — the WashHouse website,
                  apps, and related systems operated by us.
                </li>
                <li>
                  <strong className="text-foreground">Order</strong> — a request for services placed
                  by a Customer with a Partner, including pickup, processing, and delivery details.
                </li>
              </ul>
            </LegalSection>

            <LegalSection id="account" title="3. Account registration & eligibility">
              <p>
                You must be at least <strong className="text-foreground">18 years old</strong> and
                legally capable of entering a contract under Indian law to use the Platform as a
                Customer.
              </p>
              <p>
                Registration typically uses a valid Indian mobile number and one-time password
                (OTP) verification. You agree to provide accurate information and keep your account
                details up to date.
              </p>
              <p>
                You are responsible for activity on your account. Do not share OTPs or login
                credentials. Notify us promptly if you suspect unauthorised access.
              </p>
            </LegalSection>

            <LegalSection id="booking" title="4. Booking, pickup & delivery">
              <p>
                When you place an Order, you select a Partner, services (e.g. wash &amp; fold, dry
                clean), pickup window, and delivery address. Estimated turnaround times are
                indicative and may vary based on garment type, volume, and Partner capacity.
              </p>
              <p>
                You agree to make garments accessible at the scheduled pickup time and to provide
                accurate special instructions (stains, delicate fabrics, etc.). Partners may refuse or
                re-quote items that differ materially from what was booked.
              </p>
              <p>
                Real-time order tracking is provided where available. Delivery is to the address
                you specify; someone may need to be available to hand over or receive items unless
                you and the Partner agree otherwise.
              </p>
            </LegalSection>

            <LegalSection id="pricing" title="5. Pricing, GST & invoices">
              <p>
                Prices shown before checkout are estimates based on the Partner&apos;s published
                rates and your selected services. Final charges may adjust after inspection (e.g.
                extra items, premium treatments, or express handling) — you will be notified before
                work proceeds where required.
              </p>
              <p>
                Applicable <strong className="text-foreground">GST</strong> is calculated and
                displayed on your Order summary and tax invoice in line with Indian tax laws. GSTIN
                details, where applicable, appear on invoices issued through the Platform.
              </p>
              <p>
                Delivery fees, minimum order values, and promotional discounts are shown at checkout.
                Subscription plans, if offered, have separate billing terms disclosed at sign-up.
              </p>
            </LegalSection>

            <LegalSection id="payments" title="6. Payments">
              <p>
                Online payments are processed securely through{' '}
                <strong className="text-foreground">Razorpay</strong>, supporting UPI, debit/credit
                cards, net banking, and supported wallets. By paying online, you also agree to
                Razorpay&apos;s terms where applicable.
              </p>
              <p>
                <strong className="text-foreground">Cash on delivery (COD)</strong> may be offered
                for eligible Orders. With COD, you pay the Partner or authorised delivery personnel
                at delivery. Failed or refused COD payments may affect future COD eligibility.
              </p>
              <p>
                We do not store full card or UPI credentials on our servers. Payment disputes
                related to duplicate charges or failed transactions should be raised promptly via
                the app or <Link href="/contact">contact</Link> so we can assist with the payment
                provider.
              </p>
            </LegalSection>

            <LegalSection id="cancellations" title="7. Cancellations & refunds">
              <p>
                You may cancel an Order before pickup, subject to the status shown in the app.
                After pickup, cancellation may not be possible once processing has started.
              </p>
              <p>
                Refunds, where applicable, are returned to the original payment method or as store
                credit, typically within standard banking timelines (often 5–10 business days for
                UPI/cards). COD Orders refunded after delivery follow the same principles minus any
                non-refundable fees disclosed at checkout.
              </p>
              <p>
                Quality issues, damage, or loss claims are handled under our complaint and dispute
                process. We may request photos and will coordinate with the Partner to resolve
                fairly.
              </p>
            </LegalSection>

            <LegalSection id="marketplace-role" title="8. Partner responsibility & platform role">
              <p>
                WashHouse is a <strong className="text-foreground">marketplace intermediary</strong>.
                We provide discovery, booking, payments, tracking, and support tools. The Partner
                you choose is the service provider responsible for washing, dry cleaning, pressing,
                and handling your garments.
              </p>
              <p>
                Partners set their own service menus and operational standards within Platform
                guidelines. We verify Partners before listing them but do not guarantee outcomes of
                every individual Order.
              </p>
              <p>
                To the extent permitted by law, claims arising from service quality, delays, or
                garment care are primarily between you and the Partner; we will facilitate
                resolution and may apply Platform policies, refunds, or account actions where
                appropriate.
              </p>
            </LegalSection>

            <LegalSection id="conduct" title="9. User conduct & prohibited use">
              <p>You agree not to:</p>
              <ul>
                <li>Use the Platform for unlawful, fraudulent, or abusive purposes.</li>
                <li>Submit false Orders, fake reviews, or misleading information.</li>
                <li>Harass Partners, riders, or WashHouse staff.</li>
                <li>Attempt to bypass payments, fees, or security measures.</li>
                <li>Scrape, reverse engineer, or overload our systems without permission.</li>
                <li>Include hazardous or prohibited items in laundry (e.g. items that violate law or Partner policy).</li>
              </ul>
              <p>
                We may suspend or terminate accounts that breach these rules or harm other users or
                Partners.
              </p>
            </LegalSection>

            <LegalSection id="reviews" title="10. Reviews & content">
              <p>
                You may rate and review Partners after completed Orders. Reviews must be honest,
                relevant, and free of hate speech, personal attacks, or confidential information.
              </p>
              <p>
                By submitting content (reviews, photos, feedback), you grant WashHouse a
                non-exclusive licence to display and use it on the Platform for service improvement
                and marketing, unless you opt out where we offer that choice.
              </p>
              <p>
                We may moderate or remove content that violates these terms or applicable law.
              </p>
            </LegalSection>

            <LegalSection id="liability" title="11. Limitation of liability">
              <p>
                The Platform is provided &quot;as is&quot; to the fullest extent permitted by Indian
                law. We strive for reliable uptime and accurate information but do not warrant
                uninterrupted access or error-free operation.
              </p>
              <p>
                To the maximum extent allowed by law, WashHouse and its affiliates are not liable
                for indirect, incidental, or consequential damages, or for losses beyond the amount
                you paid for the relevant Order in the preceding three months, except where
                liability cannot be excluded (including under consumer protection laws).
              </p>
              <p>
                Nothing in these terms limits your statutory rights as a consumer in India.
              </p>
            </LegalSection>

            <LegalSection id="disputes" title="12. Dispute resolution & governing law">
              <p>
                These terms are governed by the <strong className="text-foreground">laws of India</strong>.
                Courts at a competent jurisdiction in India (as specified in our corporate
                registration, typically the city of our registered office) shall have exclusive
                jurisdiction, subject to mandatory consumer forum rights.
              </p>
              <p>
                We encourage you to contact us first to resolve concerns informally. Where required,
                disputes may be referred to mediation or arbitration under rules we publish, without
                prejudice to your right to approach consumer commissions.
              </p>
            </LegalSection>

            <LegalSection id="changes" title="13. Changes to these terms">
              <p>
                We may update these terms to reflect new features, legal requirements, or business
                practices. Material changes will be communicated via the Platform or registered
                contact details. Continued use after the effective date constitutes acceptance unless
                law requires explicit consent.
              </p>
              <p>The &quot;Last updated&quot; date at the top of this page shows the current version.</p>
            </LegalSection>

            <LegalSection id="contact" title="14. Contact for legal queries">
              <p>
                For legal notices, privacy questions, or formal complaints about these terms, reach
                us through our{' '}
                <Link href="/contact">contact page</Link>.
              </p>
              <p>
                Please include your registered phone number, Order ID (if any), and a clear
                description so we can respond within a reasonable time.
              </p>
            </LegalSection>

            <footer className="mt-6 rounded-lg border border-dashed border-border bg-muted/40 px-4 py-4 text-sm leading-relaxed text-muted-foreground sm:px-5">
              This is a template — have legal counsel review before production.
            </footer>
          </div>
        </div>
      </div>
    </article>
  );
}
