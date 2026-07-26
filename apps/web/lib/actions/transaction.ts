'use server';

import {
  accountTable,
  categoryTable,
  transactionCashbackTable,
  transactionHoldInfoTable,
  transactionRoundUpTable,
  transactionTable,
  transactionTagTable,
} from 'afinia-common/schema';
import { addDays, isValid, parse } from 'date-fns';
import {
  and,
  desc,
  eq,
  exists,
  getTableColumns,
  gte,
  isNotNull,
  isNull,
  lt,
  or,
  SQL,
  sql,
} from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { getServerSession } from '../auth/session';
import { getStartOfDay } from '../dateTime';
import { db } from '../db/client';
import { Prettify } from '../types';

export type TransactionCursor = Prettify<
  Pick<typeof transactionTable.$inferSelect, 'transaction_id' | 'created_at'>
>;

export type TransactionFilters = Prettify<
  Partial<
    Pick<typeof transactionTable.$inferSelect, 'account_id' | 'category_id'>
  > & {
    from?: string;
    to?: string;
    tag_id?: string;
    type?: string;
    search_term?: string;
    include_transfers?: boolean;
    has_note?: boolean;
    has_attachment?: boolean;
  }
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
  const session = await getServerSession();
  if (!session) {
    throw new Error('Unauthorised');
  }

  let offset = 0;
  const { limit } = options;
  const conditions: (SQL | undefined)[] = [];

  // Include internal transfers
  const includeTransfers =
    'filters' in options ? options.filters?.include_transfers : false;
  if (!includeTransfers) {
    conditions.push(eq(transactionTable.is_categorizable, true));
  }

  // Cursor mode
  if ('cursor' in options) {
    const { cursor } = options;
    if (cursor) {
      conditions.push(
        sql`(${transactionTable.created_at}, ${transactionTable.transaction_id}) < (${cursor.created_at.toISOString()}::timestamptz, ${cursor.transaction_id})`
      );
    }
    // Filter mode
  } else if ('filters' in options) {
    const { filters } = options;
    const categoryId = filters?.category_id?.trim();
    const searchTerm = filters?.search_term?.trim();

    if (filters?.account_id !== undefined) {
      conditions.push(eq(transactionTable.account_id, filters.account_id));
    }

    if (filters?.from) {
      const fromTimestamp = parse(filters?.from, 'yyyy-MM-dd', getStartOfDay());
      if (isValid(fromTimestamp)) {
        conditions.push(gte(transactionTable.created_at, fromTimestamp));
      } else {
        console.error('Invalid from date: ', filters?.from);
      }
    }

    if (filters?.to) {
      const toTimestamp = parse(filters?.to, 'yyyy-MM-dd', getStartOfDay());
      if (isValid(toTimestamp)) {
        // Add 1 day for boundary condition
        conditions.push(
          lt(transactionTable.created_at, addDays(toTimestamp, 1))
        );
      } else {
        console.error('Invalid to date: ', filters?.to);
      }
    }

    if (filters?.type) {
      conditions.push(eq(transactionTable.type, filters.type));
    }

    if (filters?.has_note) {
      conditions.push(isNotNull(transactionTable.note));
    }

    if (filters?.has_attachment) {
      conditions.push(isNotNull(transactionTable.attachment_id));
    }

    if (filters?.tag_id) {
      conditions.push(
        exists(
          db
            .select({ exists: sql`1` })
            .from(transactionTagTable)
            .where(
              and(
                eq(
                  transactionTagTable.transaction_id,
                  transactionTable.transaction_id
                ),
                eq(transactionTagTable.tag_id, filters.tag_id)
              )
            )
        )
      );
    }

    if (categoryId) {
      if (categoryId === 'uncategorised') {
        conditions.push(isNull(transactionTable.category_id));
      } else {
        conditions.push(
          or(
            eq(transactionTable.category_id, categoryId),
            eq(categoryTable.category_parent_id, categoryId)
          )
        );
      }
    }

    if (searchTerm) {
      conditions.push(
        sql`${transactionTable.text_search} @@ websearch_to_tsquery('english', ${searchTerm})`
      );
    }

    if (options.offset) {
      offset = options.offset;
    }
  }

  try {
    const categoryParent = alias(categoryTable, 'category_parent');

    // Note: will require another index if we will be filtering on category and account together
    const query = db
      .select({
        ...getTableColumns(transactionTable),
        category: sql<string>`${categoryTable.category_name}`.as('category'),
        category_parent_id: sql<string>`${categoryParent.category_id}`.as(
          'category_parent_id'
        ),
        category_parent: sql<string>`${categoryParent.category_name}`.as(
          'category_parent'
        ),
      })
      .from(transactionTable)
      .leftJoin(
        categoryTable,
        eq(transactionTable.category_id, categoryTable.category_id)
      )
      .leftJoin(
        categoryParent,
        eq(categoryTable.category_parent_id, categoryParent.category_id)
      )
      .where(and(...conditions, isNull(transactionTable.deleted_at)))
      .orderBy(
        desc(transactionTable.created_at),
        desc(transactionTable.transaction_id)
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
  const session = await getServerSession();
  if (!session) {
    throw new Error('Unauthorised');
  }

  try {
    const getTransactionTags = db
      .select({ tag_id: transactionTagTable.tag_id })
      .from(transactionTagTable)
      .where(eq(transactionTagTable.transaction_id, id));

    const getTransactionDetails = db
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

    const [tags, transaction] = await Promise.all([
      getTransactionTags,
      getTransactionDetails,
    ]);

    return transaction.at(0)
      ? { ...transaction.at(0), tags: tags.map((tag) => tag.tag_id) }
      : null;
  } catch (error) {
    console.error('Error fetching transaction details: ', error);
    return null;
  }
};
