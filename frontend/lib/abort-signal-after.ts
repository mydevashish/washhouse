/** Portable abort signal with timeout (jsdom lacks `AbortSignal.timeout`). */
export function abortSignalAfter(ms: number): AbortSignal {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  // Allow Node to exit if the timer outlives a short-lived request.
  if (typeof timer === 'object' && 'unref' in timer && typeof timer.unref === 'function') {
    timer.unref();
  }
  return controller.signal;
}
