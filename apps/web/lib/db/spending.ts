import { transactionExternalTable } from 'afinia-common/schema';
import { format, Interval } from 'date-fns';
import {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  inArray,
  isNotNull,
  lt,
  lte,
  or,
  sql,
} from 'drizzle-orm';
import { IntervalConfig } from 'drizzle-orm/pg-core';
import { cache } from 'react';
import { TZ } from '../constants';
import { Prettify } from '../types';
import { db } from './client';

/**
 * Transaction types that should offset spending when uncategorised
 */
const SPENDING_OFFSET_TYPES = ['Refund'];

/**
 * Net spending as a positive amount in base units.
 * Outflows are summed, offset by refunds and categorised inflows,
 * negated and floored to 0.
 * Returns 0 when inflows exceed outflows or there are no transactions.
 */
const spendingAmount =
  sql<number>`greatest(-coalesce(sum(${transactionExternalTable.value_in_base_units}) filter (where ${transactionExternalTable.value_in_base_units} < 0 or ${inArray(transactionExternalTable.type, SPENDING_OFFSET_TYPES)} or ${transactionExternalTable.category_id} is not null), 0), 0)`.mapWith(
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
 * each with its total, transaction count and most common category
 */
export const getSpendingByMerchant = (
  range: Prettify<Partial<Interval<Date, Date>>>,
  limit = 5
) => {
  const merchant = sql<string>`coalesce(${transactionExternalTable.description}, 'Unknown merchant')`;

  return db
    .select({
      merchant: merchant.as('merchant'),
      categoryId: sql<string>`mode() within group (order by ${categoryId})`.as(
        'category_id'
      ),
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
 * @returns One row per month (YYYY-MM) and category that has spending, ordered
 * by month and category name
 */
export const getSpendingByCategoryAndMonth = (
  range: Prettify<Partial<Interval<Date, Date>>>
) => {
  // TZ is inlined so the SELECT and GROUP BY expressions match
  const tz = sql.raw(`'${TZ}'`);
  const month = sql<string>`to_char(${transactionExternalTable.created_at} AT TIME ZONE ${tz}, 'YYYY-MM')`;

  return db
    .select({
      month: month.as('month'),
      categoryId: categoryId.as('category_id'),
      categoryName: categoryName.as('category_name'),
      value: spendingAmount.as('value'),
    })
    .from(transactionExternalTable)
    .where(createdWithin(range))
    .groupBy(month, categoryId, categoryName)
    .having(gt(spendingAmount, 0))
    .orderBy(asc(month), asc(categoryName));
};

/**
 * Groups net spending by ISO weekday (1 = Monday) and hour of day (in TZ).
 * @returns One row per weekday and hour that has spending
 */
export const getSpendingByHourAndWeekday = (
  range: Prettify<Partial<Interval<Date, Date>>>
) => {
  // TZ is inlined so the SELECT and GROUP BY expressions match
  const tz = sql.raw(`'${TZ}'`);
  const localCreatedAt = sql`(${transactionExternalTable.created_at} AT TIME ZONE ${tz})`;
  const weekday = sql<number>`extract(isodow from ${localCreatedAt})::int`;
  const hour = sql<number>`extract(hour from ${localCreatedAt})::int`;

  return db
    .select({
      weekday: weekday.mapWith(Number).as('weekday'),
      hour: hour.mapWith(Number).as('hour'),
      value: spendingAmount.as('value'),
      transactions:
        sql<number>`count(${transactionExternalTable.transaction_id})`
          .mapWith(Number)
          .as('transactions'),
    })
    .from(transactionExternalTable)
    .where(createdWithin(range))
    .groupBy(weekday, hour)
    .having(gt(spendingAmount, 0));
};

/**
 * List of all recent payments per merchant, used to detect recurring payments.
 * Payments on the same day are combined into one.
 * @param limit Maximum number of most recent payments per merchant
 * @returns Merchants with at least 2 payments, each with up to `limit`
 * payments ordered by merchant name and payment date
 */
export const getRecentPaymentsByMerchant = ({
  range,
  limit = 4,
}: {
  range: Interval<Date, Date>;
  limit?: number;
}) => {
  // TZ is inlined so the SELECT and GROUP BY expressions match
  const tz = sql.raw(`'${TZ}'`);
  const paymentDate = sql<string>`to_char(${transactionExternalTable.created_at} AT TIME ZONE ${tz}, 'YYYY-MM-DD')`;

  /**
   * Get merchant payments grouped by date
   */
  const merchantPayments = db.$with('payments').as(
    db
      .select({
        merchant: sql<string>`${transactionExternalTable.description}`.as(
          'merchant'
        ),
        date: paymentDate.as('date'),
        // Most common category for the merchant
        categoryId:
          sql<string>`mode() within group (order by ${categoryId})`.as(
            'category_id'
          ),
        // Outflows are negative, so negate to get a positive amount
        amount:
          sql<number>`-sum(${transactionExternalTable.value_in_base_units})`.as(
            'amount'
          ),
      })
      .from(transactionExternalTable)
      .where(
        and(
          createdWithin(range),
          lt(transactionExternalTable.value_in_base_units, 0),
          isNotNull(transactionExternalTable.description)
        )
      )
      .groupBy(transactionExternalTable.description, paymentDate)
  );

  /**
   * Rank each merchant's payments by date and count number of payments for each merchant
   */
  const ranked = db.$with('ranked').as(
    db
      .select({
        merchant: merchantPayments.merchant,
        date: merchantPayments.date,
        categoryId: merchantPayments.categoryId,
        amount: merchantPayments.amount,
        // Number each merchant's payments from newest to oldest
        rank: sql<number>`row_number() over (partition by ${merchantPayments.merchant} order by ${merchantPayments.date} desc)`.as(
          'rank'
        ),
        // Count number of payments for each merchant
        count:
          sql<number>`count(*) over (partition by ${merchantPayments.merchant})`.as(
            'count'
          ),
      })
      .from(merchantPayments)
  );

  return (
    db
      .with(merchantPayments, ranked)
      .select({
        merchant: ranked.merchant,
        date: ranked.date,
        categoryId: ranked.categoryId,
        amount: sql<number>`${ranked.amount}`.mapWith(Number),
      })
      .from(ranked)
      /**
       * Only include merchants with at least 2 payments and
       * up to `limit` most recent payments for each merchant
       */
      .where(and(lte(ranked.rank, limit), gte(ranked.count, 2)))
      // Order by merchant name and payment date
      .orderBy(asc(ranked.merchant), asc(ranked.date))
  );
};
