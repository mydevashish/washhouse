/** True when a backend URL points at this machine (unsafe for production builds). */
export function isLocalBackendHost(apiUrl: string): boolean {
  try {
    const host = new URL(apiUrl).hostname.toLowerCase();
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
  } catch {
    return true;
  }
}

/**
 * Skip remote backend I/O during `next build` and whenever the API URL is loopback.
 * Production HTML must not depend on localhost or an unavailable API.
 */
export function shouldSkipRemoteBackendFetch(apiUrl = process.env.NEXT_PUBLIC_API_URL ?? ''): boolean {
  if (process.env.NEXT_PHASE === 'phase-production-build') return true;
  if (!apiUrl.trim()) return true;
  return isLocalBackendHost(apiUrl);
}
