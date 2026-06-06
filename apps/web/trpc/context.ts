import { auth } from '@/lib/auth/config';

/**
 * TRPC context to retrieve auth session from request
 * @returns
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  // Not using getServerSession here for explicitness
  const session = await auth.api.getSession({ headers: opts.headers });
  return { auth: session };
};

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
