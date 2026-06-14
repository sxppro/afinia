import { getCategories } from '@/lib/db/category';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { authProcedure, router } from '../init';

type CategoryGroup = {
  category_parent_id: string;
  category_parent_name: string | null;
  categories: {
    category_id: string;
    category_name: string;
  }[];
};

export const categoryRouter = router({
  getCategoriesForReassignment: authProcedure.query(async () => {
    try {
      // Retrieve sub-categories
      const res = await getCategories();
      const categoryByParent = new Map<string, CategoryGroup>();

      // Group categories by parent category
      for (const category of res) {
        const parentId = category.category_parent_id ?? '';
        let group = categoryByParent.get(parentId);
        if (!group) {
          group = {
            category_parent_id: parentId,
            category_parent_name: category.category_parent_name,
            categories: [],
          };
          categoryByParent.set(parentId, group);
        }
        group.categories.push({
          category_id: category.category_id,
          category_name: category.category_name,
        });
      }

      // Sort alphabetically by parent category name
      return [...categoryByParent.values()].sort((a, b) =>
        (a.category_parent_name ?? '').localeCompare(
          b.category_parent_name ?? ''
        )
      );
    } catch (error) {
      console.error(error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve categories',
      });
    }
  }),
  reassignCategory: authProcedure
    .input(
      z.object({
        transactionId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { transactionId } = input;
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to reassign transaction category',
        });
      }
    }),
});

export type CategoryRouter = typeof categoryRouter;
