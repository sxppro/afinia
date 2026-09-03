import { transactionExternalTable } from 'afinia-common/schema';
import { format, Interval } from 'date-fns';
import {
  and,
  asc,
  desc,
  eq,
  gte,
  lt,
  lte,
  min,
  or,
  sql,
  sum,
} from 'drizzle-orm';
import { IntervalConfig, SelectedFields } from 'drizzle-orm/pg-core';
import { TZ } from '../constants';
import { Prettify } from '../types';
import { db } from './client';

export const getCategorySpending = <T extends SelectedFields>({
  select,
  range,
  category,
}: {
  select: T;
  range: Prettify<Partial<Interval<Date, Date>>>;
  category?: string;
}) =>
  db
    .select(select)
    .from(transactionExternalTable)
    .where(
      and(
        range?.start
          ? gte(transactionExternalTable.created_at, range.start)
          : undefined,
        range?.end
          ? lte(transactionExternalTable.created_at, range.end)
          : undefined,
        category
          ? or(
              eq(transactionExternalTable.category_id, category),
              eq(transactionExternalTable.category_parent_id, category)
            )
          : undefined
      )
    );

export const getCategorySpendingByTimestamp = ({
  category,
  interval,
  range,
}: {
  category?: string;
  interval: NonNullable<IntervalConfig['fields']>;
  range: Interval<Date, Date>;
}) => {
  const { start, end } = range;
  const formattedStart = format(start, 'yyyy-MM-dd');
  const formattedEnd = format(end, 'yyyy-MM-dd');
  const timestampFormat = interval === 'month' ? 'Mon YYYY' : 'DD Mon';

  return db
    .select({
      timestamp: sql<string>`to_char(time_series.interval_start AT TIME ZONE ${TZ}, '${sql.raw(
        timestampFormat
      )}')`,
      value: sql<number | null>`
      CASE 
        WHEN time_series.interval_start > NOW() THEN NULL
        WHEN coalesce(${sum(
          transactionExternalTable.value_in_base_units
        )}, 0) < 0
        THEN abs(coalesce(${sum(
          transactionExternalTable.value_in_base_units
        )}, 0))
        ELSE 0
      END
      `
        .mapWith(Number)
        .as('value'),
    })
    .from(
      sql`generate_series('${sql.raw(
        `${formattedStart} ${TZ}`
      )}'::timestamptz, '${sql.raw(
        `${formattedEnd} ${TZ}`
      )}'::timestamptz, '1 ${sql.raw(
        interval
      )}'::interval, ${TZ}) AS time_series(interval_start)`
    )
    .leftJoin(
      transactionExternalTable,
      and(
        eq(
          sql`date_trunc(${interval}, ${transactionExternalTable.created_at}, ${TZ})`,
          sql`time_series.interval_start`
        ),
        or(
          category
            ? eq(transactionExternalTable.category_id, category)
            : undefined,
          category
            ? eq(transactionExternalTable.category_parent_id, category)
            : undefined
        )
      )
    )
    .groupBy(sql<string>`time_series.interval_start`)
    .orderBy(sql<string>`time_series.interval_start`);
};

export const getMerchantSpending = <T extends SelectedFields>({
  select,
  range,
  merchant,
}: {
  select: T;
  range: Prettify<Partial<Interval<Date, Date>>>;
  merchant: string;
}) =>
  db
    .select(select)
    .from(transactionExternalTable)
    .where(
      and(
        range?.start
          ? gte(transactionExternalTable.created_at, range.start)
          : undefined,
        range?.end
          ? lte(transactionExternalTable.created_at, range.end)
          : undefined,
        eq(transactionExternalTable.description, merchant)
      )
    );

export const getMerchantSpendingByTimestamp = ({
  merchant,
  interval,
  range,
}: {
  merchant: string;
  interval: NonNullable<IntervalConfig['fields']>;
  range: Interval<Date, Date>;
}) => {
  const { start, end } = range;
  const formattedStart = format(start, 'yyyy-MM-dd');
  const formattedEnd = format(end, 'yyyy-MM-dd');
  const timestampFormat = interval === 'month' ? 'Mon YYYY' : 'DD Mon';

  return db
    .select({
      timestamp: sql<string>`to_char(time_series.interval_start AT TIME ZONE ${TZ}, '${sql.raw(
        timestampFormat
      )}')`,
      value: sql<number | null>`
        CASE
          WHEN time_series.interval_start > NOW() THEN NULL
          WHEN coalesce(${sum(
            transactionExternalTable.value_in_base_units
          )}, 0) < 0
          THEN abs(coalesce(${sum(
            transactionExternalTable.value_in_base_units
          )}, 0))
          ELSE 0
        END
      `
        .mapWith(Number)
        .as('value'),
    })
    .from(
      sql`generate_series('${sql.raw(
        `${formattedStart} ${TZ}`
      )}'::timestamptz, '${sql.raw(
        `${formattedEnd} ${TZ}`
      )}'::timestamptz, '1 ${sql.raw(
        interval
      )}'::interval, ${TZ}) AS time_series(interval_start)`
    )
    .leftJoin(
      transactionExternalTable,
      and(
        eq(
          sql`date_trunc(${interval}, ${transactionExternalTable.created_at}, ${TZ})`,
          sql`time_series.interval_start`
        ),
        eq(transactionExternalTable.description, merchant)
      )
    )
    .groupBy(sql<string>`time_series.interval_start`)
    .orderBy(sql<string>`time_series.interval_start`);
};

const netSpending = sql<number>`greatest(-coalesce(${sum(
  transactionExternalTable.value_in_base_units
)}, 0), 0)`.mapWith(Number);

const spendingRangeFilter = (range: Prettify<Partial<Interval<Date, Date>>>) =>
  and(
    range.start
      ? gte(transactionExternalTable.created_at, range.start)
      : undefined,
    range.end ? lte(transactionExternalTable.created_at, range.end) : undefined
  );

export const getSpendingTotal = async (
  range: Prettify<Partial<Interval<Date, Date>>>
) => {
  const [result] = await db
    .select({ value: netSpending.as('value') })
    .from(transactionExternalTable)
    .where(spendingRangeFilter(range));

  return result?.value ?? 0;
};

export const getSpendingByDay = ({
  range,
}: {
  range: Interval<Date, Date>;
}) => {
  const formattedStart = format(range.start, 'yyyy-MM-dd');
  const formattedEnd = format(range.end, 'yyyy-MM-dd');

  return db
    .select({
      date: sql<string>`to_char(time_series.interval_start AT TIME ZONE ${TZ}, 'YYYY-MM-DD')`,
      value: sql<number | null>`
        CASE
          WHEN time_series.interval_start > NOW() THEN NULL
          ELSE greatest(-coalesce(${sum(
            transactionExternalTable.value_in_base_units
          )}, 0), 0)
        END
      `
        .mapWith(Number)
        .as('value'),
    })
    .from(
      sql`generate_series('${sql.raw(
        `${formattedStart} ${TZ}`
      )}'::timestamptz, '${sql.raw(
        `${formattedEnd} ${TZ}`
      )}'::timestamptz, '1 day'::interval, ${TZ}) AS time_series(interval_start)`
    )
    .leftJoin(
      transactionExternalTable,
      eq(
        sql`date_trunc('day', ${transactionExternalTable.created_at}, ${TZ})`,
        sql`time_series.interval_start`
      )
    )
    .groupBy(sql`time_series.interval_start`)
    .orderBy(asc(sql`time_series.interval_start`));
};

export const getSpendingByCategory = (
  range: Prettify<Partial<Interval<Date, Date>>>
) => {
  const categoryId = sql<string>`coalesce(${transactionExternalTable.category_parent_id}, ${transactionExternalTable.category_id}, 'uncategorised')`;
  const categoryName = sql<string>`coalesce(${transactionExternalTable.category_parent}, ${transactionExternalTable.category}, 'Uncategorised')`;

  return db
    .select({
      id: categoryId.as('id'),
      name: categoryName.as('name'),
      value: netSpending.as('value'),
    })
    .from(transactionExternalTable)
    .where(spendingRangeFilter(range))
    .groupBy(categoryId, categoryName)
    .having(lt(sum(transactionExternalTable.value_in_base_units), 0))
    .orderBy(desc(netSpending));
};

export const getSpendingByMerchant = (
  range: Prettify<Partial<Interval<Date, Date>>>,
  limit = 5
) => {
  const merchant = sql<string>`coalesce(${transactionExternalTable.description}, 'Unknown merchant')`;

  return db
    .select({
      merchant: merchant.as('merchant'),
      value: netSpending.as('value'),
      transactions:
        sql<number>`count(${transactionExternalTable.transaction_id})`
          .mapWith(Number)
          .as('transactions'),
    })
    .from(transactionExternalTable)
    .where(spendingRangeFilter(range))
    .groupBy(merchant)
    .having(lt(sum(transactionExternalTable.value_in_base_units), 0))
    .orderBy(desc(netSpending))
    .limit(limit);
};

export const getSpendingCategoriesByMonth = (
  range: Prettify<Partial<Interval<Date, Date>>>
) => {
  const month = sql<string>`to_char(date_trunc('month', ${transactionExternalTable.created_at}, ${TZ}) AT TIME ZONE ${TZ}, 'Mon YY')`;
  const monthSort = sql<Date>`date_trunc('month', ${transactionExternalTable.created_at}, ${TZ})`;
  const categoryId = sql<string>`coalesce(${transactionExternalTable.category_parent_id}, ${transactionExternalTable.category_id}, 'uncategorised')`;
  const categoryName = sql<string>`coalesce(${transactionExternalTable.category_parent}, ${transactionExternalTable.category}, 'Uncategorised')`;

  return db
    .select({
      month: month.as('month'),
      monthSort: monthSort.as('month_sort'),
      categoryId: categoryId.as('category_id'),
      categoryName: categoryName.as('category_name'),
      value: netSpending.as('value'),
    })
    .from(transactionExternalTable)
    .where(spendingRangeFilter(range))
    .groupBy(monthSort, month, categoryId, categoryName)
    .having(lt(sum(transactionExternalTable.value_in_base_units), 0))
    .orderBy(asc(monthSort), asc(categoryName));
};

export const getEarliestSpendingDate = async () => {
  const [result] = await db
    .select({ date: min(transactionExternalTable.created_at).as('date') })
    .from(transactionExternalTable);

  return result?.date ?? null;
};
