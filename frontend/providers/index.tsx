'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ApiConnectivityDiagnostics } from '@/components/providers/api-connectivity';
import { AuthBootstrap } from '@/components/auth/auth-bootstrap';
import { StoreHydration } from '@/components/providers/store-hydration';
import { AuthSessionMonitor } from '@/components/session/auth-session-monitor';
import { GlobalIdleManager } from '@/components/session/global-idle-manager';
import { ThemeProvider } from '@/providers/theme-provider';

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
