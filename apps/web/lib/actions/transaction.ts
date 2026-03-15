'use server';

import { transactionExternalTable } from 'afinia-common/schema';
import { and, desc, eq, or, SQL, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { Prettify } from '../types';

export type TransactionCursor = Prettify<
  Pick<
    typeof transactionExternalTable.$inferSelect,
    'transaction_id' | 'created_at'
  >
>;

export type TransactionFilters = Prettify<
  Partial<
    Pick<
      typeof transactionExternalTable.$inferSelect,
      'account_id' | 'category_id'
    >
  > & { search_term?: string }
>;

/**
 * Paginated transaction retrieval.
 * @param options Cannot use cursor and filters together as it will require many indexes to be performant.
 * - Cursor is designed for keyset pagination with infinite scroll (only `created_at` and `transaction_id`)
 * - Filters are designed for filtering transactions
 * @returns
 */
export const getTransactionsPaginated = async (
  options:
    | {
        cursor?: TransactionCursor | null;
        limit?: number;
      }
    | { filters?: TransactionFilters; limit?: number; offset?: number }
) => {
  let offset = 0;
  const { limit } = options;
  const conditions: (SQL | undefined)[] = [];

  // Cursor mode
  if ('cursor' in options) {
    const { cursor } = options;
    if (cursor) {
      conditions.push(
        sql`(${transactionExternalTable.created_at}, ${transactionExternalTable.transaction_id}) < (${cursor.created_at.toISOString()}::timestamptz, ${cursor.transaction_id})`
      );
    }
    // Filter mode
  } else if ('filters' in options) {
    const { filters } = options;
    const accountId = filters?.account_id;
    const categoryId = filters?.category_id?.trim();
    const searchTerm = filters?.search_term?.trim();

    if (accountId !== undefined) {
      conditions.push(eq(transactionExternalTable.account_id, accountId));
    }

    if (categoryId) {
      conditions.push(
        or(
          eq(transactionExternalTable.category_id, categoryId),
          eq(transactionExternalTable.category_parent_id, categoryId)
        )
      );
    }

    if (searchTerm) {
      conditions.push(
        sql`${transactionExternalTable.text_search} @@ websearch_to_tsquery('english', ${searchTerm})`
      );
    }

    if (options.offset) {
      offset = options.offset;
    }
  }

  try {
    // Note: will require another index if we will be filtering on category and account together
    const query = db
      .select()
      .from(transactionExternalTable)
      .where(and(...conditions))
      .orderBy(
        desc(transactionExternalTable.created_at),
        desc(transactionExternalTable.transaction_id)
      )
      .offset(offset);
      
    const transactions = await (limit ? query.limit(limit + 1) : query);
    const hasMore = limit ? transactions.length > limit : false;
    const page = hasMore ? transactions.slice(0, limit) : transactions;
    // Next cursor - only provided in cursor mode
    const lastTransaction = page.at(-1);
    const next =
      'cursor' in options && lastTransaction
        ? {
            created_at: lastTransaction.created_at,
            transaction_id: lastTransaction.transaction_id,
          }
        : null;

    return { transactions: page, hasMore, next };
  } catch (error) {
    console.error('Error fetching paginated transactions: ', error);
    return { transactions: [], hasMore: false, next: null };
  }
};
