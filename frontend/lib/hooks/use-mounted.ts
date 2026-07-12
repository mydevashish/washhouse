'use client';

import { useEffect, useState } from 'react';

/** True only after the client has mounted — use to gate browser-only UI without hydration mismatch. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}
