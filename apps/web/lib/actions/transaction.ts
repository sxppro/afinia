'use server';

import { transactionExternalTable } from 'afinia-common/schema';
import { and, desc, eq, SQL, sql } from 'drizzle-orm';
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
 * @param options Ideally don't use cursor and filters together as it will require a more complex index to be performant.
 * - Cursor is designed for keyset pagination with infinite scroll (only `created_at` and `transaction_id`)
 * - Filters are designed for static pages where pagination is not required
 * @returns
 */
export const getTransactionsPaginated = async (options?: {
  cursor?: TransactionCursor;
  filters?: TransactionFilters;
  limit?: number;
}) => {
  const { cursor, filters, limit } = options || {};
  const conditions: SQL[] = [];

  if (cursor) {
    conditions.push(
      sql`(${transactionExternalTable.created_at}, ${transactionExternalTable.transaction_id}) < (${cursor.created_at.toISOString()}::timestamptz, ${cursor.transaction_id})`
    );
  }

  if (filters?.account_id) {
    conditions.push(
      eq(transactionExternalTable.account_id, filters.account_id)
    );
  }

  if (filters?.category_id) {
    conditions.push(
      eq(transactionExternalTable.category_id, filters.category_id)
    );
  }

  if (filters?.search_term) {
    conditions.push(
      sql`${transactionExternalTable.text_search} @@ websearch_to_tsquery('english', ${filters.search_term})`
    );
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
      );
    const transactions = await (limit ? query.limit(limit) : query);

    // Next cursor
    const lastTransaction = transactions.at(-1);
    const next = lastTransaction
      ? {
          created_at: lastTransaction.created_at,
          transaction_id: lastTransaction.transaction_id,
        }
      : null;

    return { transactions, next };
  } catch (error) {
    console.error('Error fetching paginated transactions: ', error);
    return { transactions: [], next: null };
  }
};
