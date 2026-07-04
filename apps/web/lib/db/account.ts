import {
  accountTable,
  transactionCashbackTable,
  transactionRoundUpTable,
  transactionTable,
} from 'afinia-common/schema';
import { and, eq, isNull, sql, sum } from 'drizzle-orm';
import { db } from './client';

/**
 * Total balance of all accounts
 * @returns
 */
export const getTotalAccountBalance = () =>
  db
    .select({
      value: sum(accountTable.value_in_base_units).mapWith(Number).as('value'),
    })
    .from(accountTable)
    .where(isNull(accountTable.deleted_at));

export const getAccount = (accountId: number) =>
  db
    .select()
    .from(accountTable)
    .where(eq(accountTable.account_id, accountId))
    .limit(1);

/**
 * Get the current account balance for an account
 * @param accountId
 * @returns
 */
export const getAccountBalance = (accountId: number) =>
  db
    .select({
      /**
       * Sum all transaction values, round ups and cashbacks
       * Note: cast to int as Postgres returns bigint
       */
      value:
        sql<number>`cast(sum(${transactionTable.value_in_base_units} + coalesce(${transactionRoundUpTable.value_in_base_units}, 0) + coalesce(${transactionCashbackTable.value_in_base_units}, 0)) as int)`.as(
          'value'
        ),
    })
    .from(transactionTable)
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
    .where(
      and(
        isNull(transactionTable.deleted_at),
        eq(transactionTable.account_id, accountId)
      )
    );
