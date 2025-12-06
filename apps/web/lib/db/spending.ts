import { transactionExternalTable } from 'afinia-common/schema';
import { format, Interval } from 'date-fns';
import { and, eq, gte, isNotNull, lte, or, sql, sum } from 'drizzle-orm';
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
        and(
          range?.start
            ? gte(transactionExternalTable.created_at, range.start)
            : undefined,
          range?.end
            ? lte(transactionExternalTable.created_at, range.end)
            : undefined,
          isNotNull(transactionExternalTable.category_id)
        ),
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
  return db
    .select({
      timestamp: sql<string>`to_char(time_series.interval_start AT TIME ZONE ${TZ}, 'DD Mon')`,
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
