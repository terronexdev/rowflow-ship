'use client';

import { useState } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { terronexTheme } from '@/lib/theme';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5_000,
        refetchOnWindowFocus: true,
        refetchOnMount: 'always',
        retry: (failureCount, error) => {
          if (error instanceof Error && error.message === 'Unauthorized') return false;
          return failureCount < 2;
        },
      },
    },
  });
}

export default function AppProviders({ children }: { children: React.ReactNode }) {
  // One client per browser tree — avoid module singleton caching wrong shapes across navigations
  const [queryClient] = useState(makeQueryClient);

  return (
    <SessionProvider refetchOnWindowFocus>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={terronexTheme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}

/** Only run authenticated data queries after NextAuth finishes loading */
export function useAuthReady() {
  const { status } = useSession();
  return {
    status,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
  };
}
