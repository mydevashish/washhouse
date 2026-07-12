'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import {
  applyStatusUpdateToOrder,
  type OrderWsMessage,
} from '@/lib/ws/order-tracking-messages';
import {
  OrderTrackingWebSocketClient,
  type OrderTrackingConnectionMode,
} from '@/lib/ws/order-tracking-client';
import { env } from '@/lib/env';
import { useMounted } from '@/lib/hooks/use-mounted';
import { queryKeys } from '@/lib/query-keys';
import type { Order } from '@/services/orders';
import { useAuthStore } from '@/store/auth.store';

/** Polling interval when WebSocket is unavailable (matches legacy behavior). */
export const ORDER_TRACKING_POLL_MS = 30_000;

type UseOrderTrackingLiveResult = {
  mode: OrderTrackingConnectionMode;
  isLive: boolean;
  /** Use as React Query `refetchInterval` — false when WebSocket is healthy. */
  pollIntervalMs: number | false;
};

type UseOrderTrackingLiveOptions = {
  /** Set false when order reaches a terminal status to close the socket. */
  enabled?: boolean;
};

export function useOrderTrackingLive(
  orderId: string,
  options: UseOrderTrackingLiveOptions = {},
): UseOrderTrackingLiveResult {
  const enabled = options.enabled ?? true;
  const mounted = useMounted();
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [mode, setMode] = useState<OrderTrackingConnectionMode>('polling');
  const clientRef = useRef<OrderTrackingWebSocketClient | null>(null);

  useEffect(() => {
    if (!mounted || !enabled || !accessToken) {
      clientRef.current?.stop();
      setMode('polling');
      return;
    }

    const handleMessage = (message: OrderWsMessage) => {
      if (message.type === 'status_update') {
        queryClient.setQueryData<Order>(queryKeys.order(orderId), (current) => {
          if (!current) return current;
          return applyStatusUpdateToOrder(current, message);
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.orders() });
        if (message.status === 'delivered' || message.status === 'cancelled') {
          client.stop();
        }
      } else if (message.type === 'connected') {
        queryClient.setQueryData<Order>(queryKeys.order(orderId), (current) => {
          if (!current) return current;
          return { ...current, status: message.status };
        });
      }
    };

    const client = new OrderTrackingWebSocketClient({
      orderId,
      accessToken,
      apiBaseUrl: env.NEXT_PUBLIC_API_URL,
      onMessage: handleMessage,
      onModeChange: setMode,
    });
    clientRef.current = client;
    client.start();

    return () => {
      client.stop();
      clientRef.current = null;
    };
  }, [accessToken, enabled, mounted, orderId, queryClient]);

  const isLive = mode === 'live';
  const pollIntervalMs = isLive ? false : ORDER_TRACKING_POLL_MS;

  return { mode, isLive, pollIntervalMs };
}
