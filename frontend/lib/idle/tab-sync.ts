import { SESSION_SYNC_CHANNEL, SESSION_SYNC_STORAGE_KEY } from '@/lib/session-config';

export type SessionSyncMessage =
  | { type: 'activity'; at: number }
  | { type: 'continue' }
  | { type: 'logout'; reason: string };

type Listener = (msg: SessionSyncMessage) => void;

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return null;
  if (!channel) channel = new BroadcastChannel(SESSION_SYNC_CHANNEL);
  return channel;
}

export function publishSessionSync(msg: SessionSyncMessage): void {
  const ch = getChannel();
  ch?.postMessage(msg);
  if (typeof window !== 'undefined' && msg.type === 'activity') {
    try {
      localStorage.setItem(SESSION_SYNC_STORAGE_KEY, String(msg.at));
    } catch {
      /* quota */
    }
  }
}

export function subscribeSessionSync(listener: Listener): () => void {
  const ch = getChannel();
  const onMessage = (ev: MessageEvent<SessionSyncMessage>) => listener(ev.data);
  ch?.addEventListener('message', onMessage);

  const onStorage = (ev: StorageEvent) => {
    if (ev.key !== SESSION_SYNC_STORAGE_KEY || !ev.newValue) return;
    listener({ type: 'activity', at: Number(ev.newValue) });
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage);
  }

  return () => {
    ch?.removeEventListener('message', onMessage);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', onStorage);
    }
  };
}
