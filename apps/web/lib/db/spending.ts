import { transactionExternalTable } from 'afinia-ingest/schema';
import { and, gte, isNotNull, lte, sum } from 'drizzle-orm';
import { DateRange, Prettify } from '../types';
import { db } from './client';

export const getCategorySpending = (range?: Prettify<Partial<DateRange>>) => {
  return db
    .select({
      id: transactionExternalTable.category_parent_id,
      name: transactionExternalTable.category_parent,
      value: sum(transactionExternalTable.value_in_base_units).mapWith(Number),
    })
    .from(transactionExternalTable)
    .where(
      and(
        range?.from
          ? gte(transactionExternalTable.created_at, range?.from)
          : undefined,
        range?.to
          ? lte(transactionExternalTable.created_at, range.to)
          : undefined,
        isNotNull(transactionExternalTable.category_id)
      )
    );
};
