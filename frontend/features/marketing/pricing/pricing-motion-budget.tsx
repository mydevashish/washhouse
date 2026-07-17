'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

const MAX_CONCURRENT = 7;

type MotionBudgetContextValue = {
  tryClaim: () => boolean;
  release: () => void;
  /** Bumps when slots free so waiting tags can retry. */
  version: number;
};

const MotionBudgetContext = createContext<MotionBudgetContextValue | null>(null);

/** Caps simultaneous idle-sway tags across hanging pegs (~6–8). */
export function PricingMotionBudgetProvider({ children }: { children: ReactNode }) {
  const activeRef = useRef(0);
  const [version, setVersion] = useState(0);

  const tryClaim = useCallback(() => {
    if (activeRef.current >= MAX_CONCURRENT) return false;
    activeRef.current += 1;
    return true;
  }, []);

  const release = useCallback(() => {
    activeRef.current = Math.max(0, activeRef.current - 1);
    setVersion((n) => n + 1);
  }, []);

  const value = useMemo(
    () => ({ tryClaim, release, version }),
    [tryClaim, release, version],
  );

  return (
    <MotionBudgetContext.Provider value={value}>{children}</MotionBudgetContext.Provider>
  );
}

export function usePricingMotionBudget(): MotionBudgetContextValue {
  const ctx = useContext(MotionBudgetContext);
  if (!ctx) {
    return {
      tryClaim: () => true,
      release: () => undefined,
      version: 0,
    };
  }
  return ctx;
}
