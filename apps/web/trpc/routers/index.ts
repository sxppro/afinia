import { router } from '../init';
import { categoryRouter } from './category';
import { spendingRouter } from './spending';
import { transactionRouter } from './transaction';

export const appRouter = router({
  category: categoryRouter,
  spending: spendingRouter,
  transaction: transactionRouter,
});

export type AppRouter = typeof appRouter;
