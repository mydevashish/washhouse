import axios from 'axios';

import { env } from '@/lib/env';
import { logger } from '@/lib/logger';

export type ConnectivityStatus = {
  ok: boolean;
  status?: number;
  latencyMs?: number;
  error?: string;
  apiUrl: string;
};

/** GET /health — no auth required. */
export async function checkApiConnectivity(): Promise<ConnectivityStatus> {
  const apiUrl = env.NEXT_PUBLIC_API_URL;
  const healthUrl = `${apiUrl.replace(/\/$/, '')}/health`;
  const started = Date.now();

  try {
    const res = await axios.get(healthUrl, {
      timeout: 5_000,
      validateStatus: () => true,
    });
    const latencyMs = Date.now() - started;
    const ok = res.status >= 200 && res.status < 300;
    return { ok, status: res.status, latencyMs, apiUrl };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { ok: false, error: message, apiUrl };
  }
}

export function logConnectivityDiagnostics(result: ConnectivityStatus): void {
  logger.info('connectivity.check', {
    apiUrl: result.apiUrl,
    ok: result.ok,
    status: result.status,
    latencyMs: result.latencyMs,
    error: result.error,
  });
}
