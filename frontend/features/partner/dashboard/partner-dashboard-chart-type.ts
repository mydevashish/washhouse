'use client';

import { useCallback, useEffect, useState } from 'react';

export type PartnerDashboardChartType = 'bar' | 'line' | 'pie' | 'area';

export const PARTNER_DASHBOARD_CHART_TYPE_KEY = 'dlm.partner.dashboard.chartType';

export const PARTNER_DASHBOARD_CHART_TYPE_OPTIONS: ReadonlyArray<{
  value: PartnerDashboardChartType;
  label: string;
}> = [
  { value: 'bar', label: 'Bar' },
  { value: 'line', label: 'Line' },
  { value: 'pie', label: 'Pie' },
  { value: 'area', label: 'Area' },
] as const;

const VALID: PartnerDashboardChartType[] = ['bar', 'line', 'pie', 'area'];

function parseChartType(raw: string | null): PartnerDashboardChartType {
  if (raw && (VALID as string[]).includes(raw)) return raw as PartnerDashboardChartType;
  return 'bar';
}

export function readPartnerDashboardChartType(): PartnerDashboardChartType {
  if (typeof window === 'undefined') return 'bar';
  return parseChartType(window.localStorage.getItem(PARTNER_DASHBOARD_CHART_TYPE_KEY));
}

export function usePartnerDashboardChartType() {
  const [chartType, setChartTypeState] = useState<PartnerDashboardChartType>('bar');

  useEffect(() => {
    setChartTypeState(readPartnerDashboardChartType());
  }, []);

  const setChartType = useCallback((next: PartnerDashboardChartType) => {
    setChartTypeState(next);
    try {
      window.localStorage.setItem(PARTNER_DASHBOARD_CHART_TYPE_KEY, next);
    } catch {
      /* quota / private mode */
    }
  }, []);

  return { chartType, setChartType };
}
