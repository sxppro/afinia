import { initTRPC, TRPCError } from '@trpc/server';
import { TRPCContext } from './context';

const t = initTRPC.context<TRPCContext>().create();

const authMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.auth) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next();
});

export const router = t.router;
export const authProcedure = t.procedure.use(authMiddleware);
