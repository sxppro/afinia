'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCContext } from '@trpc/tanstack-react-query';
import { useState } from 'react';
import { createQueryClient } from './query-client';
import { AppRouter } from './routers';

const getBaseUrl = () => {
  if (typeof window !== 'undefined')
    // browser should use relative path
    return '';
  if (process.env.VERCEL_URL)
    // vercel
    return `https://${process.env.VERCEL_URL}`;
  // localhost
  return `http://localhost:${process.env.PORT ?? 3000}`;
};

let browserQueryClient: QueryClient;

const getQueryClient = () => {
  // Always create new query client on server
  if (typeof window === 'undefined') {
    return createQueryClient();
  }

  if (!browserQueryClient) browserQueryClient = createQueryClient();

  return browserQueryClient;
};

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

export function TRPCReactProvider(
  props: Readonly<{
    children: React.ReactNode;
  }>
) {
  // NOTE: Avoid useState when initializing the query client if you don't
  //       have a suspense boundary between this and the code that may
  //       suspend because React will throw away the client on the initial
  //       render if it suspends and there is no boundary
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
        }),
      ],
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {props.children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
