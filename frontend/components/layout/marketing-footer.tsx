import Link from 'next/link';
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Youtube } from 'lucide-react';

import { WashhouseLogo, WASHHOUSE_BRAND_NAME } from '@/components/brand/washhouse-logo';
import {
  buildTelHref,
  CONTACT_CONFIG,
  SOCIAL_LINKS,
  type SocialPlatform,
} from '@/features/marketing/contact/contact-constants';
import { MARKETING_FOOTER_GROUPS } from '@/lib/navigation/marketing-footer';
import { cn } from '@/lib/utils';

const linkClassName =
  'inline-flex min-h-11 md:min-h-0 items-center rounded-sm px-0 py-1.5 md:py-0.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

const contactLinkClassName =
  'inline-flex min-h-11 md:min-h-0 items-start gap-2 py-1 md:py-0 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const SOCIAL_ICONS: Record<SocialPlatform, React.ComponentType<{ className?: string }>> = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  x: XIcon,
  youtube: Youtube,
};

type MarketingFooterProps = {
  className?: string;
  desktopContactActions?: React.ReactNode;
};

export function MarketingFooter({ className, desktopContactActions }: MarketingFooterProps) {
  const year = new Date().getFullYear();
  const telHref = buildTelHref(CONTACT_CONFIG.phone);
  const addressLines = CONTACT_CONFIG.officeAddress.split('\n').filter(Boolean);

  return (
    <footer
      className={cn('border-t border-border/60 bg-card py-8 sm:py-9', className)}
      aria-label="Site footer"
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 sm:gap-7">
          <div className="flex flex-col items-center gap-3 text-center lg:items-start lg:text-left">
            <WashhouseLogo href="/" adaptive={false} className="h-10 w-auto sm:h-11 lg:h-12 max-w-full" />
            <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
              {WASHHOUSE_BRAND_NAME} — India&apos;s doorstep laundry marketplace. Pay with UPI or
              COD. GST shown on every order.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:gap-8">
            {MARKETING_FOOTER_GROUPS.map((group) => (
              <nav key={group.id} aria-label={`${group.title} links`}>
                <h2 className="text-sm font-semibold tracking-tight text-foreground">
                  {group.title}
                </h2>
                <ul className="mt-2 space-y-0.5">
                  {group.links.map(({ href, label }) => (
                    <li key={href}>
                      <Link href={href} className={linkClassName}>
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}

            <div aria-label="Contact information">
              <h2 className="text-sm font-semibold tracking-tight text-foreground">Contact</h2>
              <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                <li>
                  <a
                    href={telHref}
                    className={contactLinkClassName}
                  >
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <span>{CONTACT_CONFIG.phone}</span>
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${CONTACT_CONFIG.supportEmail}`}
                    className={contactLinkClassName}
                  >
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <span>{CONTACT_CONFIG.supportEmail}</span>
                  </a>
                </li>
                <li className="flex gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <address className="not-italic leading-relaxed">
                    {addressLines.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </address>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 border-t border-border/60 pt-5 sm:flex-row sm:justify-between">
            <p className="text-center text-xs text-muted-foreground sm:text-left">
              &copy; {year} {WASHHOUSE_BRAND_NAME}
            </p>

            <ul className="flex items-center gap-2" aria-label="Social media">
              {SOCIAL_LINKS.map(({ platform, href, label }) => {
                const Icon = SOCIAL_ICONS[platform];
                return (
                  <li key={platform}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className={cn(
                        'inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70',
                        'text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </a>
                  </li>
                );
              })}
            </ul>

            {desktopContactActions ? (
              <div className="hidden lg:block">{desktopContactActions}</div>
            ) : null}
          </div>
        </div>
      </div>
    </footer>
  );
}
