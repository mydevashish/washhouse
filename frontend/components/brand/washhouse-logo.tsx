import Image from 'next/image';

import Link from 'next/link';



import { WashhouseIconMark } from '@/components/brand/washhouse-icon-mark';

import { cn } from '@/lib/utils';



export const WASHHOUSE_BRAND_NAME = 'The WashHouse Laundry & Dryclean';

export const WASHHOUSE_FULL_LOGO_SRC = '/brand/washhouse-logo.png';

export const WASHHOUSE_ICON_SRC = '/brand/washhouse-icon.png';



/** Transparent trimmed PNG dimensions — no canvas padding. */

const FULL_LOGO_WIDTH = 962;

const FULL_LOGO_HEIGHT = 683;

const ICON_WIDTH = 270;

const ICON_HEIGHT = 197;



export type WashhouseLogoProps = {

  variant?: 'full' | 'icon';

  className?: string;

  priority?: boolean;

  /**

   * When true (default), navbar-safe: icon below `sm`, medium wordmark `sm–lg`,

   * full wordmark `lg+`. Set false on auth/marketing heroes so the wordmark

   * always shows and scales with the viewport.

   */

  adaptive?: boolean;

  /** Slim navbar density — icon on mobile, smaller wordmark on `sm+`. Does not affect auth heroes. */

  compact?: boolean;

  /** When set, wraps the logo in a Next.js `Link`. Defaults to `/discover`. */

  href?: string;

};



const linkClassName =

  'inline-flex shrink-0 items-center overflow-hidden rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';



const objectContain = 'object-contain';



function WashhouseIconLogo({

  className,

  inLink = false,

}: {

  className?: string;

  inLink?: boolean;

}) {

  return (

    <WashhouseIconMark

      className={cn('h-7 w-auto shrink-0 sm:h-8 lg:h-9', className)}

      width={ICON_WIDTH}

      height={ICON_HEIGHT}

      role={inLink ? undefined : 'img'}

      aria-label={inLink ? undefined : WASHHOUSE_BRAND_NAME}

      aria-hidden={inLink ? true : undefined}

    />

  );

}



function IconLogoImage({

  className,

  inLink = false,

}: {

  className?: string;

  inLink?: boolean;

}) {

  return <WashhouseIconLogo className={className} inLink={inLink} />;

}



function AdaptiveFullLogo({

  className,

  priority,

  compact = false,

  inLink = false,

}: {

  className?: string;

  priority?: boolean;

  compact?: boolean;

  inLink?: boolean;

}) {

  return (

    <span

      className={cn(

        compact

          ? 'inline-flex h-6 shrink-0 items-center sm:h-7 lg:h-7 xl:h-11'

          : 'inline-flex h-7 shrink-0 items-center sm:h-8 lg:h-9 xl:h-12',

        className,

      )}

    >

      {/* Mobile (< sm): vector icon — crisp at navbar sizes; no PNG preload. */}

      <WashhouseIconMark

        className={cn('w-auto shrink-0 sm:hidden', compact ? 'h-6' : 'h-7')}

        width={ICON_WIDTH}

        height={ICON_HEIGHT}

        role={inLink ? undefined : 'img'}

        aria-label={inLink ? undefined : WASHHOUSE_BRAND_NAME}

        aria-hidden={inLink ? true : undefined}

      />



      {/* Tablet (sm–lg): horizontal wordmark */}

      <Image

        src={WASHHOUSE_FULL_LOGO_SRC}

        alt={WASHHOUSE_BRAND_NAME}

        width={FULL_LOGO_WIDTH}

        height={FULL_LOGO_HEIGHT}

        priority={priority}

        sizes={compact ? '(max-width: 1023px) 45px, 56px' : '(max-width: 1023px) 45px, 62px'}

        className={cn(

          'hidden w-auto shrink-0 sm:block lg:hidden',

          objectContain,

          compact ? 'h-6 sm:h-7' : 'h-8',

        )}

      />



      {/* Laptop / desktop (lg+): full wordmark */}

      <Image

        src={WASHHOUSE_FULL_LOGO_SRC}

        alt={WASHHOUSE_BRAND_NAME}

        width={FULL_LOGO_WIDTH}

        height={FULL_LOGO_HEIGHT}

        sizes={compact ? '(min-width: 1280px) 62px, 56px' : '(min-width: 1280px) 68px, 62px'}

        className={cn(

          'hidden w-auto shrink-0 lg:block',

          objectContain,

          compact ? 'h-7 xl:h-11' : 'h-9 xl:h-12',

        )}

      />

    </span>

  );

}



/** Always shows the wordmark; height scales across breakpoints (auth heroes, footer). */

function StaticFullLogo({

  className,

  priority,

}: {

  className?: string;

  priority?: boolean;

}) {

  return (

    <Image

      src={WASHHOUSE_FULL_LOGO_SRC}

      alt={WASHHOUSE_BRAND_NAME}

      width={FULL_LOGO_WIDTH}

      height={FULL_LOGO_HEIGHT}

      priority={priority}

      sizes="(max-width: 639px) 52px, (max-width: 1023px) 64px, 68px"

      className={cn(

        'h-9 w-auto max-w-full shrink-0 sm:h-11 lg:h-12',

        objectContain,

        className,

      )}

    />

  );

}



export function WashhouseLogo({

  variant = 'full',

  className,

  priority = false,

  adaptive = true,

  compact = false,

  href = '/discover',

}: WashhouseLogoProps) {

  const inLink = Boolean(href);



  const logo =

    variant === 'icon' ? (

      <IconLogoImage className={className} inLink={inLink} />

    ) : adaptive ? (

      <AdaptiveFullLogo

        className={className}

        priority={priority}

        compact={compact}

        inLink={inLink}

      />

    ) : (

      <StaticFullLogo className={className} priority={priority} />

    );



  if (!href) {

    return logo;

  }



  return (

    <Link href={href} className={linkClassName} aria-label={WASHHOUSE_BRAND_NAME}>

      {logo}

    </Link>

  );

}


