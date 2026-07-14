'use client';

import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ApiConnectivityDiagnostics } from '@/components/providers/api-connectivity';
import { AuthBootstrap } from '@/components/auth/auth-bootstrap';
import { StoreHydration } from '@/components/providers/store-hydration';
import { AuthSessionMonitor } from '@/components/session/auth-session-monitor';
import { GlobalIdleManager } from '@/components/session/global-idle-manager';
import { isOnlineBookingEnabledFromEnv } from '@/lib/online-booking';
import { queryKeys } from '@/lib/query-keys';
import { ThemeProvider } from '@/providers/theme-provider';
import { getPublicAppConfig } from '@/services/app-config';

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: { retry: 0 },
        },
      }),
  );

  useEffect(() => {
    if (!isOnlineBookingEnabledFromEnv()) return;
    void client.prefetchQuery({
      queryKey: queryKeys.appConfig(),
      queryFn: getPublicAppConfig,
      staleTime: 5 * 60_000,
    });
  }, [client]);

  return (
    <ThemeProvider>
      <QueryClientProvider client={client}>
        <ApiConnectivityDiagnostics />
        <AuthBootstrap />
        <StoreHydration />
        <GlobalIdleManager />
        <AuthSessionMonitor />
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
