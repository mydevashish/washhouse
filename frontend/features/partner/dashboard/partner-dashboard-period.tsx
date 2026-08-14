'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type PartnerDashboardPeriod = 'today' | 'week' | 'month' | 'year';

/** Overview API still today/week/month only — Year is franchise-dashboard live. */
export const PARTNER_DASHBOARD_PERIOD_OPTIONS: ReadonlyArray<{
  value: Exclude<PartnerDashboardPeriod, 'year'>;
  label: string;
}> = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
] as const;

type PartnerDashboardPeriodContextValue = {
  period: PartnerDashboardPeriod;
  setPeriod: (period: PartnerDashboardPeriod) => void;
};

const PartnerDashboardPeriodContext = createContext<PartnerDashboardPeriodContextValue | null>(
  null,
);

export function PartnerDashboardPeriodProvider({
  children,
  defaultPeriod = 'week',
}: {
  children: ReactNode;
  defaultPeriod?: PartnerDashboardPeriod;
}) {
  const [period, setPeriodState] = useState<PartnerDashboardPeriod>(defaultPeriod);
  const setPeriod = useCallback((next: PartnerDashboardPeriod) => {
    setPeriodState(next);
  }, []);

  const value = useMemo(() => ({ period, setPeriod }), [period, setPeriod]);

  return (
    <PartnerDashboardPeriodContext.Provider value={value}>
      {children}
    </PartnerDashboardPeriodContext.Provider>
  );
}

export function usePartnerDashboardPeriod() {
  const ctx = useContext(PartnerDashboardPeriodContext);
  if (!ctx) {
    throw new Error('usePartnerDashboardPeriod must be used within PartnerDashboardPeriodProvider');
  }
  return ctx;
}

/** Optional hook for components that may render outside the provider during tests. */
export function usePartnerDashboardPeriodOptional() {
  return useContext(PartnerDashboardPeriodContext);
}
