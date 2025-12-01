import { transactionExternalTable } from 'afinia-common/schema';
import { format } from 'date-fns';
import {
  and,
  eq,
  gte,
  isNotNull,
  lte,
  or,
  SelectedFields,
  sql,
  sum,
} from 'drizzle-orm';
import { IntervalConfig, PgColumn, PgTable } from 'drizzle-orm/pg-core';
import { TZ } from '../constants';
import { DateRange, Prettify } from '../types';
import { db } from './client';

export const getCategorySpending = <
  T extends SelectedFields<PgColumn, PgTable>
>({
  select,
  range,
  category,
}: {
  select: T;
  range: Prettify<Partial<DateRange>>;
  category?: string;
}) =>
  db
    .select(select)
    .from(transactionExternalTable)
    .where(
      and(
        and(
          range?.from
            ? gte(transactionExternalTable.created_at, range.from)
            : undefined,
          range?.to
            ? lte(transactionExternalTable.created_at, range.to)
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
  range: DateRange;
}) => {
  const { from, to } = range;
  const formattedFrom = format(from, 'yyyy-MM-dd');
  const formattedTo = format(to, 'yyyy-MM-dd');
  return db
    .select({
      timestamp: sql<string>`to_char(time_series.interval_start AT TIME ZONE ${TZ}, 'DD Mon')`,
      value: sql<number>`
      CASE 
        WHEN coalesce(${sum(
          transactionExternalTable.value_in_base_units
        )}, 0) < 0
        THEN abs(coalesce(${sum(
          transactionExternalTable.value_in_base_units
        )}, 0))
        ELSE 0
      END
      `.mapWith(Number),
    })
    .from(
      sql`generate_series('${sql.raw(
        `${formattedFrom} ${TZ}`
      )}'::timestamptz, '${sql.raw(
        `${formattedTo} ${TZ}`
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
