import { router } from '../init';
import { categoryRouter } from './category';

export const appRouter = router({
  category: categoryRouter,
});

export type AppRouter = typeof appRouter;
