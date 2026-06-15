import { getCategoryById } from '@/lib/db/category';
import { updateTransactionCategory } from '@/lib/db/transaction';
import { upClient } from '@/lib/providers/up';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { authProcedure, router } from '../init';

export const transactionRouter = router({
  reassignCategory: authProcedure
    .input(
      z.object({
        transactionId: z.number(),
        providerId: z.string(),
        category: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { transactionId, providerId, category } = input;

        const { error } = await upClient.PATCH(
          '/transactions/{transactionId}/relationships/category',
          {
            params: {
              path: {
                transactionId: providerId,
              },
            },
            body: {
              data: {
                type: 'categories',
                id: category,
              },
            },
          }
        );
        if (error) throw error;

        // Return category info
        const categoryInfoFetch = getCategoryById(category).then(
          (res) => res[0]
        );

        // Update db if successful
        const [_, categoryInfo] = await Promise.all([
          updateTransactionCategory(transactionId, category),
          categoryInfoFetch,
        ]);

        // Throw if for some reason we don't have this category in the db
        if (!categoryInfo) {
          throw new Error('Category not found');
        }

        return {
          category_id: categoryInfo.category.category_id,
          category: categoryInfo.category.category_name,
          category_parent: categoryInfo.category_parent?.category_name ?? '',
          category_parent_id: categoryInfo.category_parent?.category_id ?? '',
        };
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to reassign transaction category',
        });
      }
    }),
});

export type TransactionRouter = typeof transactionRouter;
