'use client';

import { useCallback, useEffect, useState } from 'react';

/** Location hash without the leading `#` (empty string when none). */
export function useLocationHash(): [string, () => void] {
  const [hash, setHash] = useState('');

  const readHash = useCallback(() => {
    const value = window.location.hash.replace(/^#/, '');
    setHash(value);
    return value;
  }, []);

  useEffect(() => {
    readHash();
    window.addEventListener('hashchange', readHash);
    return () => window.removeEventListener('hashchange', readHash);
  }, [readHash]);

  return [hash, readHash];
}
