'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  buildPartnerOrdersQueuePath,
  chipPresetUrlPatch,
  parsePartnerCustomerScope,
  parsePartnerOrdersQueueUrlState,
  resolvePartnerOrdersQueueApiFilters,
  type PartnerCustomerScope,
  type PartnerOrdersHubListChip,
  type PartnerOrdersQueueApiFilters,
  type PartnerOrdersQueueUrlState,
} from '@/features/partner/orders-hub/partner-orders-hub-queue';

const SEARCH_DEBOUNCE_MS = 300;

export function usePartnerOrdersQueueState() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlState = useMemo(
    () => parsePartnerOrdersQueueUrlState(searchParams),
    [searchParams],
  );

  const customerScope: PartnerCustomerScope = useMemo(
    () => parsePartnerCustomerScope(urlState),
    [urlState],
  );

  const apiFilters: PartnerOrdersQueueApiFilters = useMemo(
    () => resolvePartnerOrdersQueueApiFilters(urlState),
    [urlState],
  );

  const [searchInput, setSearchInput] = useState(urlState.q);

  useEffect(() => {
    setSearchInput(urlState.q);
  }, [urlState.q]);

  const replaceQueue = useCallback(
    (patch: Parameters<typeof buildPartnerOrdersQueuePath>[0]) => {
      router.replace(buildPartnerOrdersQueuePath(patch, searchParams), { scroll: false });
    },
    [router, searchParams],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = searchInput.trim();
      if (next === urlState.q) return;
      replaceQueue({ q: next || null });
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchInput, urlState.q, replaceQueue]);

  const setChip = useCallback(
    (chip: PartnerOrdersHubListChip) => {
      replaceQueue({ ...chipPresetUrlPatch(chip), q: searchInput.trim() || null });
    },
    [replaceQueue, searchInput],
  );

  const clearQueueFilters = useCallback(() => {
    setSearchInput('');
    replaceQueue({
      chip: null,
      q: null,
      status: null,
      source: null,
      payment: null,
      phone: null,
      customer: null,
    });
  }, [replaceQueue]);

  const clearCustomerScope = useCallback(() => {
    setSearchInput('');
    replaceQueue({
      phone: null,
      customer: null,
      q: null,
    });
  }, [replaceQueue]);

  const setStatus = useCallback(
    (status: string) => {
      replaceQueue({
        status: status || null,
        chip: urlState.chip === 'all' ? null : urlState.chip,
        q: searchInput.trim() || null,
      });
    },
    [replaceQueue, searchInput, urlState.chip],
  );

  const setSource = useCallback(
    (source: string) => {
      replaceQueue({
        source: source || null,
        chip: urlState.chip === 'all' ? null : urlState.chip,
        q: searchInput.trim() || null,
      });
    },
    [replaceQueue, searchInput, urlState.chip],
  );

  const setPayment = useCallback(
    (payment: string) => {
      replaceQueue({
        payment: payment || null,
        chip: urlState.chip === 'all' ? null : urlState.chip,
        q: searchInput.trim() || null,
      });
    },
    [replaceQueue, searchInput, urlState.chip],
  );

  return {
    urlState,
    customerScope,
    apiFilters,
    searchInput,
    setSearchInput,
    setChip,
    setStatus,
    setSource,
    setPayment,
    clearQueueFilters,
    clearCustomerScope,
  } satisfies {
    urlState: PartnerOrdersQueueUrlState;
    customerScope: PartnerCustomerScope;
    apiFilters: PartnerOrdersQueueApiFilters;
    searchInput: string;
    setSearchInput: (value: string) => void;
    setChip: (chip: PartnerOrdersHubListChip) => void;
    setStatus: (status: string) => void;
    setSource: (source: string) => void;
    setPayment: (payment: string) => void;
    clearQueueFilters: () => void;
    clearCustomerScope: () => void;
  };
}
