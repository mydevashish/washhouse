export * from '@/lib/navigation/back';
export * from '@/lib/navigation/breadcrumbs';
export * from '@/lib/navigation/marketing-footer';
export * from '@/lib/navigation/marketing-nav';
export * from '@/lib/navigation/search-index';
export * from '@/lib/navigation/types';

/** @deprecated Use shouldShowBack(pathname, app) */
export { shouldShowBack as shouldShowBackLegacy } from '@/lib/navigation/back';
export { getBackFallbackHref as getBackHref } from '@/lib/navigation/back';
