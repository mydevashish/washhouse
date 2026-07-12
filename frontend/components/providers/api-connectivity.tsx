'use client';

import { useEffect } from 'react';

import { checkApiConnectivity, logConnectivityDiagnostics } from '@/lib/connectivity';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';

/** Dev diagnostics: logs API URL and health check result once on load. */
export function ApiConnectivityDiagnostics() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;

    logger.info('connectivity.config', {
      NEXT_PUBLIC_API_URL: env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
    });

    void checkApiConnectivity().then((result) => {
      logConnectivityDiagnostics(result);
      if (!result.ok) {
        logger.warn('connectivity.failed', {
          hint: 'Set frontend NEXT_PUBLIC_API_URL to match the port uvicorn listens on (backend .env PORT).',
          ...result,
        });
      }
    });
  }, []);

  return null;
}
