/** Shared layout classes for mobile bottom nav + safe areas (iOS home indicator). */

/** Padding below page content when AppShell mobile tab bar is visible. */
export const PAGE_PADDING_BOTTOM_NAV =
  'pb-[max(4rem,calc(3.5rem+env(safe-area-inset-bottom,0px)))] sm:pb-8';

/** Fixed elements that sit above the mobile tab bar. */
export const FIXED_ABOVE_MOBILE_NAV =
  'bottom-[max(3.5rem,calc(3.5rem+env(safe-area-inset-bottom,0px)))]';

/** Standard centered page container. */
export const PAGE_CONTAINER = 'mx-auto w-full max-w-screen-xl px-4 sm:px-6';

/** Vertical rhythm for app pages. */
export const PAGE_SECTION = 'py-4 sm:py-5';
