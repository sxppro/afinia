import { getCategoriesGrouped } from '@/lib/db/category';
import { TRPCError } from '@trpc/server';
import { authProcedure, router } from '../init';

export const categoryRouter = router({
  getCategoriesForReassignment: authProcedure.query(async () => {
    try {
      return await getCategoriesGrouped();
    } catch (error) {
      console.error(error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve categories',
      });
    }
  }),
});

export type CategoryRouter = typeof categoryRouter;
