import { SERVER_INSTANCE_STORAGE_KEY } from '@/lib/session-config';

const HEADER = 'x-server-instance-id';

export function readStoredServerInstanceId(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(SERVER_INSTANCE_STORAGE_KEY);
}

export function storeServerInstanceId(id: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SERVER_INSTANCE_STORAGE_KEY, id);
}

export function clearStoredServerInstanceId(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SERVER_INSTANCE_STORAGE_KEY);
}

export function extractServerInstanceId(headers: Record<string, unknown> | undefined): string | null {
  if (!headers) return null;
  const raw =
    headers[HEADER] ??
    headers['X-Server-Instance-Id'] ??
    (headers as { get?: (k: string) => string | null }).get?.(HEADER);
  if (typeof raw === 'string' && raw.length > 0) return raw;
  return null;
}

/** Returns true when the client should force re-login (backend restarted). */
export function isServerInstanceMismatch(incomingId: string | null): boolean {
  if (!incomingId) return false;
  const stored = readStoredServerInstanceId();
  if (!stored) return false;
  return stored !== incomingId;
}
