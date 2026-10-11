import { router } from '../init';
import { categoryRouter } from './category';
import { transactionRouter } from './transaction';

export const appRouter = router({
  category: categoryRouter,
  transaction: transactionRouter,
});

export type AppRouter = typeof appRouter;
