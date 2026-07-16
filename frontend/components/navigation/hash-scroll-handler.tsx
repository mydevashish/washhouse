'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const MAX_SCROLL_ATTEMPTS = 48;
const RETRY_INTERVAL_MS = 50;

/** Scroll a hash target into view; returns true when the element exists. */
export function scrollToHash(
  hash: string,
  behavior: ScrollBehavior = 'smooth',
): boolean {
  const id = hash.replace(/^#/, '');
  if (!id) return false;

  const target = document.getElementById(id);
  if (!target) return false;

  target.scrollIntoView({ behavior, block: 'start' });
  return true;
}

function scheduleScrollToHash(behavior: ScrollBehavior = 'auto') {
  const hash = window.location.hash;
  if (!hash) return;

  let attempts = 0;

  const tryScroll = () => {
    if (scrollToHash(hash, behavior) || attempts >= MAX_SCROLL_ATTEMPTS) return;
    attempts += 1;
    window.setTimeout(tryScroll, RETRY_INTERVAL_MS);
  };

  tryScroll();
}

/** Next.js may apply `location.hash` slightly after `pathname` updates on client navigations. */
function scheduleScrollAfterNavigation() {
  let attempts = 0;

  const tick = () => {
    if (window.location.hash) {
      scheduleScrollToHash();
      return;
    }
    if (attempts >= MAX_SCROLL_ATTEMPTS) return;
    attempts += 1;
    window.setTimeout(tick, RETRY_INTERVAL_MS);
  };

  tick();
}

/** Scrolls to `location.hash` after client navigations and hash changes. */
export function HashScrollHandler() {
  const pathname = usePathname();

  useEffect(() => {
    scheduleScrollAfterNavigation();
  }, [pathname]);

  useEffect(() => {
    scheduleScrollAfterNavigation();
  }, []);

  useEffect(() => {
    const onHashChange = () => scheduleScrollToHash();
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return null;
}
