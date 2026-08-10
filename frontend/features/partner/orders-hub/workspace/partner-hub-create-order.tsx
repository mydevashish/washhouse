'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { PartnerCreateOrderDialog } from '@/features/partner/components/partner-create-order-dialog';
import { PartnerDashboardCreateSuccessPanel } from '@/features/partner/components/partner-dashboard-create-success-panel';
import type { WalkInOrder } from '@/services/partner-walk-in-orders';

export type PartnerHubCreateOrderPrefill = {
  phone?: string;
  name?: string;
};

type PartnerHubCreateOrderContextValue = {
  openCreateOrder: (prefill?: PartnerHubCreateOrderPrefill) => void;
};

const PartnerHubCreateOrderContext = createContext<PartnerHubCreateOrderContextValue | null>(
  null,
);

export function usePartnerHubCreateOrder(): PartnerHubCreateOrderContextValue {
  const ctx = useContext(PartnerHubCreateOrderContext);
  if (!ctx) {
    throw new Error('usePartnerHubCreateOrder must be used within PartnerHubCreateOrderProvider');
  }
  return ctx;
}

const PARTNER_ORDERS_HUB_PATH = '/partner/orders';

export function PartnerHubCreateOrderUrlListener() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openCreateOrder } = usePartnerHubCreateOrder();

  useEffect(() => {
    const tab = searchParams.get('tab');
    const createFlag = searchParams.get('create');
    if (tab !== 'create' && createFlag !== '1') return;

    const params = new URLSearchParams(searchParams.toString());
    params.delete('tab');
    params.delete('create');

    const phone = params.get('phone') ?? undefined;
    const name = params.get('name') ?? undefined;

    openCreateOrder({ phone, name });

    const qs = params.toString();
    router.replace(qs ? `${PARTNER_ORDERS_HUB_PATH}?${qs}` : PARTNER_ORDERS_HUB_PATH, {
      scroll: false,
    });
  }, [openCreateOrder, router, searchParams]);

  return null;
}

/** Dashboard-style create dialog for Customers & Orders hub entry points. */
export function PartnerHubCreateOrderProvider({ children }: { children: ReactNode }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [prefill, setPrefill] = useState<PartnerHubCreateOrderPrefill>({});
  const [sessionKey, setSessionKey] = useState(0);
  const [createdOrder, setCreatedOrder] = useState<WalkInOrder | null>(null);
  const successRef = useRef<HTMLDivElement>(null);

  const openCreateOrder = useCallback((next?: PartnerHubCreateOrderPrefill) => {
    setCreatedOrder(null);
    setPrefill({
      phone: next?.phone?.trim() ?? '',
      name: next?.name?.trim() ?? '',
    });
    setSessionKey((k) => k + 1);
    setDialogOpen(true);
  }, []);

  const value = useMemo(() => ({ openCreateOrder }), [openCreateOrder]);

  return (
    <PartnerHubCreateOrderContext.Provider value={value}>
      {children}
      {createdOrder ? (
        <PartnerDashboardCreateSuccessPanel
          ref={successRef}
          order={createdOrder}
          onAddAnother={() => {
            setCreatedOrder(null);
            openCreateOrder();
          }}
        />
      ) : null}
      <PartnerCreateOrderDialog
        key={sessionKey}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialPhone={prefill.phone ?? ''}
        initialName={prefill.name ?? ''}
        onOrderCreated={(result) => {
          if (result.kind === 'walk_in') {
            setCreatedOrder(result.order);
          }
        }}
      />
    </PartnerHubCreateOrderContext.Provider>
  );
}
