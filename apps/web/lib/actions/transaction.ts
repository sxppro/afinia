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
  asc,
  desc,
  eq,
  exists,
  getTableColumns,
  gt,
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
import { TransactionSort } from '../transaction-sort';
import { Prettify } from '../types';

export type TransactionCursor = Prettify<
  Pick<
    typeof transactionTable.$inferSelect,
    'transaction_id' | 'created_at' | 'value_in_base_units'
  >
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
    merchant?: string;
  }
>;

/**
 * Paginated transaction retrieval.
 * Uses deterministic keyset pagination for unfiltered, filtered, and sorted
 * transaction lists.
 * @returns
 */
export const getTransactionsPaginated = async (options: {
  cursor?: TransactionCursor | null;
  filters?: TransactionFilters;
  sort?: TransactionSort;
  limit?: number;
}) => {
  const session = await getServerSession();
  if (!session) {
    throw new Error('Unauthorised');
  }

  const { cursor, filters, sort, limit } = options;
  const conditions: (SQL | undefined)[] = [];

  // Include internal transfers
  const includeTransfers = filters?.include_transfers;
  if (!includeTransfers) {
    conditions.push(eq(transactionTable.is_categorizable, true));
  }

  if (filters) {
    const categoryId = filters?.category_id?.trim();
    const searchTerm = filters?.search_term?.trim();
    const merchant = filters?.merchant;

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

    if (filters?.has_note === true) {
      conditions.push(isNotNull(transactionTable.note));
    }

    if (filters?.has_attachment === true) {
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

    if (merchant) {
      conditions.push(eq(transactionTable.description, merchant));
    }

    if (searchTerm) {
      conditions.push(
        sql`${transactionTable.text_search} @@ websearch_to_tsquery('english', ${searchTerm})`
      );
    }
  }

  if (cursor) {
    const cursorTimestamp = cursor.created_at.toISOString();
    const cursorAbsAmount = Math.abs(cursor.value_in_base_units);
    const absAmount = sql<number>`abs(${transactionTable.value_in_base_units}::bigint)`;
    /**
     * If tied on amount, retrieve earlier transactions and transactions
     * at same time with lower ID
     */
    const afterAmountTie = or(
      lt(transactionTable.created_at, sql`${cursorTimestamp}::timestamptz`),
      and(
        eq(transactionTable.created_at, sql`${cursorTimestamp}::timestamptz`),
        lt(transactionTable.transaction_id, cursor.transaction_id)
      )
    );

    /**
     * Sort by date (ascending or descending via keyset pagination) or
     * amount (by absolute value)
     */
    conditions.push(
      sort === 'date-asc'
        ? sql`(${transactionTable.created_at}, ${transactionTable.transaction_id}) > (${cursorTimestamp}::timestamptz, ${cursor.transaction_id})`
        : sort === 'amount-asc'
          ? or(
              gt(absAmount, cursorAbsAmount),
              and(eq(absAmount, cursorAbsAmount), afterAmountTie)
            )
          : sort === 'amount-desc'
            ? or(
                lt(absAmount, cursorAbsAmount),
                and(eq(absAmount, cursorAbsAmount), afterAmountTie)
              )
            : sql`(${transactionTable.created_at}, ${transactionTable.transaction_id}) < (${cursorTimestamp}::timestamptz, ${cursor.transaction_id})`
    );
  }

  try {
    const categoryParent = alias(categoryTable, 'category_parent');
    const orderBy =
      sort === 'date-asc'
        ? [
            asc(transactionTable.created_at),
            asc(transactionTable.transaction_id),
          ]
        : sort === 'amount-asc'
          ? [
              asc(sql`abs(${transactionTable.value_in_base_units}::bigint)`),
              desc(transactionTable.created_at),
              desc(transactionTable.transaction_id),
            ]
          : sort === 'amount-desc'
            ? [
                desc(sql`abs(${transactionTable.value_in_base_units}::bigint)`),
                desc(transactionTable.created_at),
                desc(transactionTable.transaction_id),
              ]
            : [
                desc(transactionTable.created_at),
                desc(transactionTable.transaction_id),
              ];

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
      .orderBy(...orderBy);

    const transactions = await (limit ? query.limit(limit + 1) : query);
    const hasMore = limit ? transactions.length > limit : false;
    const page = hasMore ? transactions.slice(0, limit) : transactions;
    const lastTransaction = page.at(-1);
    const next = lastTransaction
      ? {
          created_at: lastTransaction.created_at,
          transaction_id: lastTransaction.transaction_id,
          value_in_base_units: lastTransaction.value_in_base_units,
        }
      : null;

    return { transactions: page, hasMore, next };
  } catch (error) {
    console.error('Error fetching paginated transactions: ', error);
    throw error;
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
