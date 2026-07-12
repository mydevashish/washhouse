import { env } from '@/lib/env';

/** Resolve API-relative media paths to absolute URLs for next/image and img src. */
export function mediaUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
