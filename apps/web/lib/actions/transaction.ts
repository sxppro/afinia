'use server';

import { transactionExternalTable } from 'afinia-common/schema';
import { and, desc, eq, SQL, sql } from 'drizzle-orm';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { db } from '../db/client';

export type TransactionCursor = Pick<
  typeof transactionExternalTable.$inferSelect,
  'transaction_id' | 'created_at'
>;

export type TransactionFilters = Pick<
  typeof transactionExternalTable.$inferSelect,
  'account_id' | 'category_id'
>;

export const getTransactionsPaginated = async (options: {
  cursor?: TransactionCursor;
  filters?: TransactionFilters;
  limit?: number;
}) => {
  const { cursor, filters, limit = DEFAULT_PAGE_SIZE } = options;
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

  try {
    // Note: will require another index if we will be filtering on category and account together
    const transactions = await db
      .select()
      .from(transactionExternalTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(
        desc(transactionExternalTable.created_at),
        desc(transactionExternalTable.transaction_id)
      )
      .limit(limit);

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
