'use server';

import {
  accountTable,
  transactionCashbackTable,
  transactionExternalTable,
  transactionHoldInfoTable,
  transactionRoundUpTable,
  transactionTable,
  transactionTagTable,
} from 'afinia-common/schema';
import { and, desc, eq, isNull, or, SQL, sql } from 'drizzle-orm';
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
      if (categoryId === 'uncategorised') {
        conditions.push(isNull(transactionExternalTable.category_id));
      } else {
        conditions.push(
          or(
            eq(transactionExternalTable.category_id, categoryId),
            eq(transactionExternalTable.category_parent_id, categoryId)
          )
        );
      }
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

/**
 * Retrieve transaction details by ID
 * - Account name
 * - Round up
 * - Cashback
 * - Hold info
 * - Tags
 * @param id transaction ID
 */
export const getTransactionDetailById = async (id: number) => {
  try {
    const tags = await db
      .select({ tag_id: transactionTagTable.tag_id })
      .from(transactionTagTable)
      .where(eq(transactionTagTable.transaction_id, id));

    const transaction = await db
      .select({
        account: {
          display_name: accountTable.display_name,
          type: accountTable.type,
        },
        hold_info: {
          currency_code: transactionHoldInfoTable.currency_code,
          value: transactionHoldInfoTable.value,
          value_in_base_units: transactionHoldInfoTable.value_in_base_units,
          foreign_currency_code: transactionHoldInfoTable.foreign_currency_code,
          foreign_value: transactionHoldInfoTable.foreign_value,
          foreign_value_in_base_units:
            transactionHoldInfoTable.foreign_value_in_base_units,
        },
        round_up: {
          currency_code: transactionRoundUpTable.currency_code,
          value: transactionRoundUpTable.value,
          value_in_base_units: transactionRoundUpTable.value_in_base_units,
          boost_currency_code: transactionRoundUpTable.boost_currency_code,
          boost_value: transactionRoundUpTable.boost_value,
          boost_value_in_base_units:
            transactionRoundUpTable.boost_value_in_base_units,
        },
        cashback: {
          description: transactionCashbackTable.description,
          currency_code: transactionCashbackTable.currency_code,
          value: transactionCashbackTable.value,
          value_in_base_units: transactionCashbackTable.value_in_base_units,
        },
      })
      .from(transactionTable)
      .leftJoin(
        accountTable,
        eq(accountTable.account_id, transactionTable.account_id)
      )
      .leftJoin(
        transactionRoundUpTable,
        eq(
          transactionTable.transaction_id,
          transactionRoundUpTable.transaction_id
        )
      )
      .leftJoin(
        transactionCashbackTable,
        eq(
          transactionTable.transaction_id,
          transactionCashbackTable.transaction_id
        )
      )
      .leftJoin(
        transactionHoldInfoTable,
        eq(
          transactionTable.transaction_id,
          transactionHoldInfoTable.transaction_id
        )
      )
      .where(eq(transactionTable.transaction_id, id))
      .limit(1);

    return transaction.at(0)
      ? { ...transaction.at(0), tags: tags.map((tag) => tag.tag_id) }
      : null;
  } catch (error) {
    console.error('Error fetching transaction details: ', error);
    return null;
  }
};
