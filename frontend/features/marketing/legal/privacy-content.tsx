import Link from 'next/link';

import { WASHHOUSE_BRAND_NAME } from '@/components/brand/washhouse-logo';
import { CONTACT_CONFIG } from '@/features/marketing/contact/contact-constants';

import { LEGAL_LAST_UPDATED } from '@/features/marketing/legal/legal-constants';
import { LegalSection } from '@/features/marketing/legal/legal-section';

const TOC_SECTIONS = [
  { id: 'controller', title: 'Who we are (data controller)' },
  { id: 'data-collected', title: 'Data we collect' },
  { id: 'purposes', title: 'How we use your data' },
  { id: 'legal-basis', title: 'Legal basis & consent' },
  { id: 'third-parties', title: 'Third-party service providers' },
  { id: 'retention', title: 'Retention & deletion' },
  { id: 'your-rights', title: 'Your rights' },
  { id: 'cookies', title: 'Cookies & local storage' },
  { id: 'security', title: 'Security measures' },
  { id: 'children', title: "Children's privacy" },
  { id: 'changes', title: 'Changes to this policy' },
  { id: 'grievance', title: 'Grievance officer & contact' },
] as const;

export function PrivacyContent() {
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
              This Privacy Policy is provided in plain English for transparency. It is a template
              and must be reviewed by qualified legal counsel before production use.
            </p>
          </div>

          <p className="mt-6 text-xs font-bold uppercase tracking-widest text-primary sm:text-sm">
            Legal
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm text-muted-foreground sm:text-base">
            Last updated: {LEGAL_LAST_UPDATED}
          </p>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            This policy explains how {WASHHOUSE_BRAND_NAME} (&quot;WashHouse&quot;, &quot;we&quot;,
            &quot;us&quot;) collects, uses, shares, and protects your personal data when you use the
            Doorstep Laundry Marketplace (DLM) platform in India.
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
            <LegalSection id="controller" title="1. Who we are (data controller)">
              <p>
                {WASHHOUSE_BRAND_NAME} operates the DLM platform. For the purposes of applicable
                Indian privacy and data protection laws, we act as the{' '}
                <strong className="text-foreground">data fiduciary / data controller</strong> for
                personal data processed through our website and apps.
              </p>
              <p>
                <strong className="text-foreground">Registered entity:</strong>
                <br />
                WashHouse Laundry &amp; Dryclean Pvt. Ltd.
                <br />
                {CONTACT_CONFIG.officeAddress.split('\n').map((line, index) => (
                  <span key={line}>
                    {line}
                    {index < CONTACT_CONFIG.officeAddress.split('\n').length - 1 ? <br /> : null}
                  </span>
                ))}
                <br />
                Email: privacy@washhouse.in
              </p>
              <p>
                Independent laundry Partners listed on the Platform may process your data as
                separate controllers when fulfilling your Order (e.g. handling garments at their
                facility). This policy covers data processed by WashHouse; Partner-specific practices
                may also apply at the store level.
              </p>
            </LegalSection>

            <LegalSection id="data-collected" title="2. Data we collect">
              <p>Depending on how you use the Platform, we may collect:</p>
              <ul>
                <li>
                  <strong className="text-foreground">Identity &amp; contact:</strong> name, mobile
                  phone number, email address.
                </li>
                <li>
                  <strong className="text-foreground">Addresses:</strong> pickup and delivery
                  addresses, saved locations, and address labels you provide.
                </li>
                <li>
                  <strong className="text-foreground">Order data:</strong> service selections,
                  garment notes, order history, status updates, ratings, reviews, and complaint
                  records.
                </li>
                <li>
                  <strong className="text-foreground">Payment metadata:</strong> transaction IDs,
                  payment method type (UPI, card, net banking, COD), amounts, GST details, and
                  refund status. We do <strong className="text-foreground">not</strong> store full
                  card numbers, CVV, or UPI PINs on our servers.
                </li>
                <li>
                  <strong className="text-foreground">Location:</strong> approximate or precise
                  location (with your permission) to show nearby Stores, estimate delivery, and
                  improve discovery — you can control this in device settings.
                </li>
                <li>
                  <strong className="text-foreground">Device &amp; usage:</strong> IP address,
                  browser/app type, device identifiers, pages viewed, clicks, crash logs, and
                  diagnostic data for performance and security.
                </li>
                <li>
                  <strong className="text-foreground">Communications:</strong> messages you send to
                  support, and records of SMS, email, or WhatsApp notifications we send (where
                  enabled).
                </li>
              </ul>
              <p>
                We collect data you provide directly, automatically when you use the Platform, and
                from payment and messaging providers as needed to complete transactions.
              </p>
            </LegalSection>

            <LegalSection id="purposes" title="3. How we use your data">
              <p>We use personal data to:</p>
              <ul>
                <li>Create and manage your account (including phone OTP verification).</li>
                <li>Process Orders — booking, pickup scheduling, Partner assignment, tracking, and delivery.</li>
                <li>Facilitate payments (UPI, cards, wallets, COD reconciliation) and issue GST invoices.</li>
                <li>
                  Send service notifications via SMS, email, WhatsApp, and in-app alerts (order
                  updates, OTPs, delivery ETAs).
                </li>
                <li>Provide customer support and resolve disputes or complaints.</li>
                <li>Prevent fraud, abuse, and unauthorised access; enforce our Terms.</li>
                <li>
                  Improve the Platform — analytics, A/B tests, and product development (often using
                  aggregated or de-identified data where possible).
                </li>
                <li>Comply with legal obligations, tax records, and lawful requests from authorities.</li>
                <li>
                  Send marketing about WashHouse offers where permitted — you can opt out anytime.
                </li>
              </ul>
            </LegalSection>

            <LegalSection id="legal-basis" title="4. Legal basis & consent">
              <p>
                We process personal data under applicable Indian law, including the{' '}
                <strong className="text-foreground">Information Technology Act, 2000</strong> and
                rules thereunder (including reasonable security practices), and with awareness of
                the <strong className="text-foreground">Digital Personal Data Protection Act, 2023</strong>{' '}
                (DPDP Act) and related rules as they come into force.
              </p>
              <p>Depending on context, processing may be based on:</p>
              <ul>
                <li>
                  <strong className="text-foreground">Your consent</strong> — e.g. marketing
                  messages, optional location, non-essential cookies where required.
                </li>
                <li>
                  <strong className="text-foreground">Performance of a contract</strong> — providing
                  the services you request when you place an Order or subscribe to a plan.
                </li>
                <li>
                  <strong className="text-foreground">Legitimate interests</strong> — fraud
                  prevention, security, and improving the Platform, balanced against your rights.
                </li>
                <li>
                  <strong className="text-foreground">Legal obligation</strong> — tax, accounting,
                  and regulatory requirements.
                </li>
              </ul>
              <p>
                Where consent is required, you may withdraw it through account settings or by
                contacting us. Withdrawal does not affect processing already carried out lawfully.
              </p>
            </LegalSection>

            <LegalSection id="third-parties" title="5. Third-party service providers">
              <p>
                We share data with trusted processors who help us run the Platform, only as needed
                and under contractual safeguards:
              </p>
              <ul>
                <li>
                  <strong className="text-foreground">Razorpay</strong> — payment processing (UPI,
                  cards, net banking).
                </li>
                <li>
                  <strong className="text-foreground">Cloud hosting</strong> — e.g. Vercel
                  (frontend), Railway (backend APIs), Neon (database).
                </li>
                <li>
                  <strong className="text-foreground">SMS / OTP providers</strong> — phone
                  verification and transactional SMS.
                </li>
                <li>
                  <strong className="text-foreground">Resend</strong> — transactional and service
                  emails.
                </li>
                <li>
                  <strong className="text-foreground">WhatsApp Business API</strong> (where enabled)
                  — order updates you opt into.
                </li>
                <li>
                  <strong className="text-foreground">Analytics &amp; error monitoring</strong> —
                  aggregated usage and crash reporting.
                </li>
              </ul>
              <p>
                We may also share data with Partners to fulfil your Order, delivery personnel for
                pickup/drop, and authorities when required by law. We do not sell your personal
                data.
              </p>
            </LegalSection>

            <LegalSection id="retention" title="6. Retention & deletion">
              <p>
                We keep personal data only as long as needed for the purposes above, including:
              </p>
              <ul>
                <li>Active account data — while your account exists and as needed to provide services.</li>
                <li>Order and payment records — typically 7–8 years for tax and audit compliance.</li>
                <li>Support tickets — for a reasonable period after resolution.</li>
                <li>Marketing preferences — until you opt out or delete your account.</li>
                <li>Logs and security data — shorter periods unless needed for investigations.</li>
              </ul>
              <p>
                When data is no longer required, we delete or anonymise it in line with our
                retention schedule and applicable law. Backups may persist for a limited time before
                rotation.
              </p>
            </LegalSection>

            <LegalSection id="your-rights" title="7. Your rights">
              <p>
                Subject to applicable Indian law (including DPDP Act provisions as in force), you
                may have the right to:
              </p>
              <ul>
                <li>Access personal data we hold about you.</li>
                <li>Correct inaccurate or incomplete data.</li>
                <li>Request deletion of data where legally permitted.</li>
                <li>Withdraw consent for processing that relies on consent.</li>
                <li>Nominate another person to exercise rights on your behalf in certain cases.</li>
                <li>Grieve to our Grievance Officer (see below) if concerns are unresolved.</li>
              </ul>
              <p>
                To exercise these rights, submit a request via our{' '}
                <Link href="/contact">contact page</Link>. We may verify your identity (e.g. OTP to
                your registered phone) before acting. We aim to respond within timelines prescribed
                by law.
              </p>
            </LegalSection>

            <LegalSection id="cookies" title="8. Cookies & local storage">
              <p>We use cookies and similar technologies (including local storage) to:</p>
              <ul>
                <li>
                  <strong className="text-foreground">Session &amp; auth</strong> — keep you signed
                  in securely and protect against CSRF.
                </li>
                <li>
                  <strong className="text-foreground">Preferences</strong> — theme (light/dark/system)
                  and locale choices.
                </li>
                <li>
                  <strong className="text-foreground">PWA</strong> — cache assets for faster load
                  when you install the app to your home screen.
                </li>
                <li>
                  <strong className="text-foreground">Analytics</strong> — understand how the
                  Platform is used (often with consent where required).
                </li>
              </ul>
              <p>
                You can control cookies through browser settings; blocking essential cookies may
                affect login and checkout. We will update this section if we add non-essential
                tracking that requires explicit consent.
              </p>
            </LegalSection>

            <LegalSection id="security" title="9. Security measures">
              <p>
                We implement reasonable technical and organisational measures aligned with Indian
                law, including:
              </p>
              <ul>
                <li>Encryption in transit (HTTPS/TLS) for data sent between your device and our servers.</li>
                <li>Access controls and role-based permissions for staff and systems.</li>
                <li>Secure password hashing and JWT-based authentication with refresh tokens.</li>
                <li>Payment card/UPI data handled by PCI-compliant payment partners — not stored in full on our side.</li>
                <li>Monitoring, logging, and incident response procedures.</li>
              </ul>
              <p>
                No method of transmission or storage is 100% secure. Please use a strong device
                lock, do not share OTPs, and report suspected breaches promptly via{' '}
                <Link href="/contact">contact</Link>.
              </p>
            </LegalSection>

            <LegalSection id="children" title="10. Children's privacy">
              <p>
                The Platform is <strong className="text-foreground">not intended for anyone under 18</strong>.
                We do not knowingly collect personal data from children. If you believe a minor has
                provided data to us, contact us and we will take steps to delete it.
              </p>
            </LegalSection>

            <LegalSection id="changes" title="11. Changes to this policy">
              <p>
                We may update this Privacy Policy for new features, legal requirements, or
                business practices. Material changes will be communicated via the Platform, email,
                or SMS where appropriate. The &quot;Last updated&quot; date at the top shows the
                current version.
              </p>
              <p>
                Continued use after the effective date means you accept the updated policy, except
                where explicit consent is required by law.
              </p>
            </LegalSection>

            <LegalSection id="grievance" title="12. Grievance officer & contact">
              <p>
                For privacy questions, data requests, or complaints under Indian law, contact our
                Grievance Officer:
              </p>
              <p>
                <strong className="text-foreground">Name:</strong> Data Protection Team
                <br />
                <strong className="text-foreground">Email:</strong> grievance@washhouse.in
                <br />
                <strong className="text-foreground">Address:</strong>
                <br />
                {CONTACT_CONFIG.officeAddress.split('\n').join(', ')}
              </p>
              <p>
                You may also reach us through our general{' '}
                <Link href="/contact">contact page</Link>. Include your registered phone number and
                a clear description of your request.
              </p>
              <p>
                If your concern is not resolved satisfactorily, you may have the right to escalate
                to the Data Protection Board of India or other remedies under applicable law once
                available.
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
