import { createTRPCContext } from '@/trpc/context';
import { appRouter } from '@/trpc/routers';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: async (opts) =>
      await createTRPCContext({ headers: opts.req.headers }),
    responseMeta: ({ ctx }) => {
      if (ctx?.auth) {
        return {
          headers: new Headers({
            'cache-control': 'private',
          }),
        };
      }
      return {};
    },
    onError: ({ error, path, type }) => {
      console.error(`[tRPC] Failed ${type} ${path}:\n`, error);
    },
  });

export { handler as GET, handler as POST };
