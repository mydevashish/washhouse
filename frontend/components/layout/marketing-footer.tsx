import Link from 'next/link';

import { WashhouseLogo, WASHHOUSE_BRAND_NAME } from '@/components/brand/washhouse-logo';
import { MARKETING_FOOTER_GROUPS } from '@/lib/navigation/marketing-footer';
import { cn } from '@/lib/utils';

const linkClassName =
  'inline-flex min-h-11 items-center rounded-sm px-1 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

type MarketingFooterProps = {
  className?: string;
};

export function MarketingFooter({ className }: MarketingFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn('border-t border-border/60 bg-card py-10 sm:py-12', className)}
      aria-label="Site footer"
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 sm:gap-12">
          <div className="flex flex-col items-center gap-8 text-center lg:items-start lg:text-left">
            <div className="inline-flex max-w-full justify-center overflow-hidden rounded-md p-1 dark:bg-white/90 lg:justify-start">
              <WashhouseLogo href="/" adaptive={false} className="max-w-full" />
            </div>

            <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
              {WASHHOUSE_BRAND_NAME} — India&apos;s doorstep laundry marketplace. Pay with UPI or
              COD. GST shown on every order.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4 lg:gap-10">
            {MARKETING_FOOTER_GROUPS.map((group) => (
              <nav key={group.id} aria-label={`${group.title} links`}>
                <h2 className="text-sm font-semibold tracking-tight text-foreground">
                  {group.title}
                </h2>
                <ul className="mt-3 space-y-1">
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
          </div>

          <p className="border-t border-border/60 pt-6 text-center text-xs text-muted-foreground lg:text-left">
            &copy; {year} {WASHHOUSE_BRAND_NAME}
          </p>
        </div>
      </div>
    </footer>
  );
}
