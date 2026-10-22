import { transactionExternalTable } from 'afinia-common/schema';
import { format, Interval } from 'date-fns';
import { and, asc, desc, eq, gt, gte, lte, or, sql } from 'drizzle-orm';
import { IntervalConfig } from 'drizzle-orm/pg-core';
import { cache } from 'react';
import { TZ } from '../constants';
import { Prettify } from '../types';
import { db } from './client';

/**
 * Net spending as a positive amount in base units.
 * Sum of transaction values are negated and floored to 0.
 * Returns 0 when the sum of transaction values is positive or
 * there are no transactions.
 */
const spendingAmount =
  sql<number>`greatest(-coalesce(sum(${transactionExternalTable.value_in_base_units}), 0), 0)`.mapWith(
    Number
  );

/**
 * Maps a transaction to its parent category, otherwise it is "uncategorised".
 */
const categoryId = sql<string>`coalesce(${transactionExternalTable.category_parent_id}, 'uncategorised')`;
const categoryName = sql<string>`coalesce(${transactionExternalTable.category_parent}, 'Uncategorised')`;

/**
 * Restricts transactions to those created within the range
 */
const createdWithin = (range: Prettify<Partial<Interval<Date, Date>>>) =>
  and(
    range.start
      ? gte(transactionExternalTable.created_at, range.start)
      : undefined,
    range.end ? lte(transactionExternalTable.created_at, range.end) : undefined
  );

/**
 * Time series of net spending by day or month buckets (in TZ).
 * @returns Time series. Buckets with no spending return 0,
 * buckets in the future return null
 */
export const getSpendingTimeSeries = ({
  category,
  merchant,
  interval,
  range,
}: {
  category?: string;
  merchant?: string;
  interval: NonNullable<IntervalConfig['fields']>;
  range: Interval<Date, Date>;
}) => {
  const { start, end } = range;
  const formattedStart = format(start, 'yyyy-MM-dd');
  const formattedEnd = format(end, 'yyyy-MM-dd');
  const timestampFormat = interval === 'month' ? 'Mon YYYY' : 'DD Mon';
  const intervalStart = sql`time_series.interval_start`;

  return db
    .select({
      date: sql<string>`to_char(${intervalStart} AT TIME ZONE ${TZ}, 'YYYY-MM-DD')`,
      timestamp: sql<string>`to_char(${intervalStart} AT TIME ZONE ${TZ}, ${timestampFormat})`,
      value: sql<number | null>`
      CASE
        WHEN ${intervalStart} > NOW() THEN NULL
        ELSE ${spendingAmount}
      END
      `
        .mapWith(Number)
        .as('value'),
    })
    .from(
      sql`generate_series(${formattedStart}::date::timestamp AT TIME ZONE ${TZ}, ${formattedEnd}::date::timestamp AT TIME ZONE ${TZ}, ${`1 ${interval}`}::interval, ${TZ}) AS time_series(interval_start)`
    )
    .leftJoin(
      transactionExternalTable,
      and(
        eq(
          sql`date_trunc(${interval}, ${transactionExternalTable.created_at}, ${TZ})`,
          intervalStart
        ),
        createdWithin(range),
        category
          ? or(
              eq(transactionExternalTable.category_id, category),
              eq(transactionExternalTable.category_parent_id, category)
            )
          : undefined,
        merchant
          ? eq(transactionExternalTable.description, merchant)
          : undefined
      )
    )
    .groupBy(intervalStart)
    .orderBy(intervalStart);
};

/**
 * Sum of all net spending
 */
export const getSpendingTotal = async (
  range: Prettify<Partial<Interval<Date, Date>>>
) => {
  const [result] = await db
    .select({ value: spendingAmount.as('value') })
    .from(transactionExternalTable)
    .where(createdWithin(range));

  return result?.value ?? 0;
};

/**
 * Groups net spending by category.
 * Cached per request (by range reference).
 * @returns The top categories ordered by spending
 */
export const getSpendingByCategory = cache(
  async (range: Prettify<Partial<Interval<Date, Date>>>) =>
    db
      .select({
        id: categoryId.as('id'),
        name: categoryName.as('name'),
        value: spendingAmount.as('value'),
      })
      .from(transactionExternalTable)
      .where(createdWithin(range))
      .groupBy(categoryId, categoryName)
      .having(gt(spendingAmount, 0))
      .orderBy(desc(spendingAmount))
);

/**
 * Groups net spending by merchant
 * @returns The top `limit` merchants ordered by spending,
 * each with its total and transaction count
 */
export const getSpendingByMerchant = (
  range: Prettify<Partial<Interval<Date, Date>>>,
  limit = 5
) => {
  const merchant = sql<string>`coalesce(${transactionExternalTable.description}, 'Unknown merchant')`;

  return db
    .select({
      merchant: merchant.as('merchant'),
      value: spendingAmount.as('value'),
      transactions:
        sql<number>`count(${transactionExternalTable.transaction_id})`
          .mapWith(Number)
          .as('transactions'),
    })
    .from(transactionExternalTable)
    .where(createdWithin(range))
    .groupBy(merchant)
    .having(gt(spendingAmount, 0))
    .orderBy(desc(spendingAmount))
    .limit(limit);
};

/**
 * Groups net spending by category and calendar month (in TZ).
 * @returns One row per month and category that has spending, ordered
 * by month and category name
 */
export const getSpendingByCategoryAndMonth = (
  range: Prettify<Partial<Interval<Date, Date>>>
) => {
  // TZ is inlined as a literal (not a bound param) so the SELECT and GROUP BY
  // expressions are textually identical and Postgres can match them.
  const tz = sql.raw(`'${TZ}'`);
  const monthSort = sql<Date>`date_trunc('month', ${transactionExternalTable.created_at}, ${tz})`;
  const month = sql<string>`to_char(${monthSort} AT TIME ZONE ${tz}, 'Mon YY')`;

  return db
    .select({
      month: month.as('month'),
      monthSort: monthSort.as('month_sort'),
      categoryId: categoryId.as('category_id'),
      categoryName: categoryName.as('category_name'),
      value: spendingAmount.as('value'),
    })
    .from(transactionExternalTable)
    .where(createdWithin(range))
    .groupBy(monthSort, categoryId, categoryName)
    .having(gt(spendingAmount, 0))
    .orderBy(asc(monthSort), asc(categoryName));
};
