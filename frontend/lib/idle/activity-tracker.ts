import { publishSessionSync } from '@/lib/idle/tab-sync';

type ActivityCallback = () => void;

const THROTTLE_MS = 1_000;

/** Global pointer/keyboard/scroll/touch/visibility activity — used by GlobalIdleManager. */
export function startActivityTracker(onActivity: ActivityCallback): () => void {
  if (typeof window === 'undefined') return () => {};

  let lastEmit = 0;

  const emit = () => {
    const now = Date.now();
    if (now - lastEmit < THROTTLE_MS) return;
    lastEmit = now;
    publishSessionSync({ type: 'activity', at: now });
    onActivity();
  };

  const opts: AddEventListenerOptions = { passive: true, capture: true };

  const windowEvents: Array<keyof WindowEventMap> = [
    'mousemove',
    'pointermove',
    'mousedown',
    'pointerdown',
    'keydown',
    'scroll',
    'touchstart',
    'touchmove',
    'wheel',
    'click',
    'focus',
  ];

  for (const ev of windowEvents) {
    window.addEventListener(ev, emit, opts);
  }

  const onVisibility = () => {
    if (document.visibilityState === 'visible') emit();
  };
  document.addEventListener('visibilitychange', onVisibility);

  return () => {
    for (const ev of windowEvents) {
      window.removeEventListener(ev, emit, opts);
    }
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
