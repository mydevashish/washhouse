'use client';

import { useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  parsePartnerHubWorkspace,
  type PartnerHubWorkspaceId,
} from '@/features/partner/orders-hub/workspace/partner-hub-workspace-types';

const PARTNER_ORDERS_HUB_PATH = '/partner/orders';

const QUEUE_PARAM_KEYS = ['chip', 'q', 'status', 'source', 'payment', 'phone', 'customer'] as const;

function hasQueueLens(params: URLSearchParams): boolean {
  return QUEUE_PARAM_KEYS.some((key) => params.has(key) && params.get(key));
}

/** Shallow `replace` for `?workspace=` while preserving other hub query params. */
export function usePartnerHubWorkspaceUrl() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const workspace = parsePartnerHubWorkspace(searchParams.get('workspace'));

  const setWorkspace = useCallback(
    (next: PartnerHubWorkspaceId | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next) {
        params.set('workspace', next);
      } else {
        params.delete('workspace');
      }
      const qs = params.toString();
      router.replace(qs ? `${PARTNER_ORDERS_HUB_PATH}?${qs}` : PARTNER_ORDERS_HUB_PATH, {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  return { workspace, setWorkspace, isOpen: workspace != null };
}

/** Map legacy hub tabs / queue URLs onto pillar workspaces or dedicated routes. */
export function usePartnerHubLegacyHubRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get('tab');
    const params = new URLSearchParams(searchParams.toString());

    if (tab === 'create' || params.get('create') === '1') {
      return;
    }

    if (tab === 'requests') {
      params.delete('tab');
      const qs = params.toString();
      router.replace(qs ? `/partner/booking-requests?${qs}` : '/partner/booking-requests', {
        scroll: false,
      });
      return;
    }

    if (tab === 'directory' || tab === 'desk') {
      params.delete('tab');
      params.set('workspace', 'customers');
      router.replace(`${PARTNER_ORDERS_HUB_PATH}?${params.toString()}`, { scroll: false });
      return;
    }

    if (tab === 'orders' || tab === 'place-order' || tab === 'booking-requests') {
      params.delete('tab');
      if (hasQueueLens(params)) {
        params.set('workspace', 'orders');
      }
      const qs = params.toString();
      router.replace(qs ? `${PARTNER_ORDERS_HUB_PATH}?${qs}` : PARTNER_ORDERS_HUB_PATH, {
        scroll: false,
      });
      return;
    }

    if (!tab && hasQueueLens(params) && !params.get('workspace')) {
      params.set('workspace', 'orders');
      router.replace(`${PARTNER_ORDERS_HUB_PATH}?${params.toString()}`, { scroll: false });
    }
  }, [router, searchParams]);
}

/** @deprecated Use usePartnerHubLegacyHubRedirect */
export function usePartnerHubLegacyTabRedirect() {
  usePartnerHubLegacyHubRedirect();
}
