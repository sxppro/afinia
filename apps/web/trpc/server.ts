import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { headers } from 'next/headers';
import { cache } from 'react';
import 'server-only';
import { createTRPCContext } from './context';
import { createQueryClient } from './query-client';
import { appRouter } from './routers';

export const getQueryClient = cache(createQueryClient);

export const trpc = createTRPCOptionsProxy({
  ctx: async () => await createTRPCContext({ headers: await headers() }),
  router: appRouter,
  queryClient: getQueryClient,
});
