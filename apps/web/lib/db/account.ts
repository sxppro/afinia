import {
  accountTable,
  transactionCashbackTable,
  transactionRoundUpTable,
  transactionTable,
} from 'afinia-common/schema';
import { differenceInCalendarYears, format, Interval } from 'date-fns';
import { and, eq, isNull, lt, min, sql } from 'drizzle-orm';
import { TZ } from '../constants';
import { db } from './client';

/**
 * Total balance of all accounts
 * @returns
 */
export const getTotalAccountBalance = () =>
  db
    .select({
      /**
       * Sum all transaction values, round ups and cashbacks
       * Note: cast to int as Postgres returns bigint
       */
      value:
        sql<number>`sum(${transactionTable.value_in_base_units} + coalesce(${transactionRoundUpTable.value_in_base_units}, 0) + coalesce(${transactionCashbackTable.value_in_base_units}, 0))`
          .mapWith(Number)
          .as('value'),
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
    .where(isNull(transactionTable.deleted_at));

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
        sql<number>`sum(${transactionTable.value_in_base_units} + coalesce(${transactionRoundUpTable.value_in_base_units}, 0) + coalesce(${transactionCashbackTable.value_in_base_units}, 0))`
          .mapWith(Number)
          .as('value'),
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

/**
 * Get the account balance by day over a specified date range
 * @returns
 */
export const getAccountBalanceByDay = ({
  range,
  accountId,
}: {
  range: Interval<Date, Date>;
  accountId?: number;
}) => {
  const { start, end } = range;
  const formattedStart = format(start, 'yyyy-MM-dd');
  const formattedEnd = format(end, 'yyyy-MM-dd');
  const timestampFormat =
    differenceInCalendarYears(end, start) > 0 ? 'DD Mon YY' : 'DD Mon';
  /**
   * Net balance change per transaction = txn value + round up + cashback
   */
  const netBalanceChange = sql<number>`${transactionTable.value_in_base_units} + coalesce(${transactionRoundUpTable.value_in_base_units}, 0) + coalesce(${transactionCashbackTable.value_in_base_units}, 0)`;
  /**
   * Interval time series
   */
  const timeSeries = sql`generate_series('${sql.raw(
    `${formattedStart} ${TZ}`
  )}'::timestamptz, '${sql.raw(
    `${formattedEnd} ${TZ}`
  )}'::timestamptz, '1 day'::interval, ${TZ}) AS time_series(interval_start)`;

  /**
   * Calculate changes in balance by day
   */
  const deltaBalances = db.$with('delta_balances').as(
    db
      .select({
        timestamp:
          sql`date_trunc('day', ${transactionTable.created_at}, ${TZ})`.as(
            'timestamp'
          ),
        delta: sql<string>`sum(${netBalanceChange})`.as('delta'),
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
          accountId !== undefined
            ? eq(transactionTable.account_id, accountId)
            : undefined
        )
      )
      // Group by first column (timestamp)
      .groupBy(sql`1`)
  );
  /**
   * Calculate opening balance up to start of required range
   */
  const openingBalance = db.$with('opening_balance').as(
    db
      .select({
        value: sql<string>`coalesce(sum(${netBalanceChange}), 0)`.as('value'),
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
          lt(transactionTable.created_at, start),
          accountId !== undefined
            ? eq(transactionTable.account_id, accountId)
            : undefined
        )
      )
  );

  return db
    .with(deltaBalances, openingBalance)
    .select({
      timestamp:
        sql<string>`to_char(time_series.interval_start AT TIME ZONE ${TZ}, '${sql.raw(timestampFormat)}')`.as(
          'timestamp'
        ),
      value:
        sql<number>`${openingBalance.value} + sum(coalesce(${deltaBalances.delta}, 0)) over (order by time_series.interval_start)`
          .mapWith(Number)
          .as('value'),
    })
    .from(timeSeries)
    .crossJoin(openingBalance)
    .leftJoin(
      deltaBalances,
      eq(sql<Date>`time_series.interval_start`, deltaBalances.timestamp)
    )
    .orderBy(sql<Date>`time_series.interval_start`);
};

/**
 * Get the earliest account creation date
 * @returns
 */
export const getEarliestAccountCreatedAt = async () => {
  const [result] = await db
    .select({ date: min(accountTable.created_at).as('date') })
    .from(accountTable)
    .where(isNull(accountTable.deleted_at));

  return result;
};
