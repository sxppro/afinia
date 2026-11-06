import {
  transactionExternalTable,
  transactionTable,
} from 'afinia-common/schema';
import { Interval } from 'date-fns';
import { and, eq, gte, isNotNull, isNull, lte, or } from 'drizzle-orm';
import { SelectedFields } from 'drizzle-orm/pg-core';
import { Prettify } from '../types';
import { db } from './client';

export const updateTransactionCategory = (id: number, category: string) =>
  db
    .update(transactionTable)
    .set({
      category_id: category,
      updated_at: new Date(),
      updated_by: 'afinia-web',
    })
    .where(eq(transactionTable.transaction_id, id));

/**
 * Retrieves all unique transaction types
 */
export const getTransactionTypes = () =>
  db
    .selectDistinct({
      type: transactionTable.type,
    })
    .from(transactionTable)
    .where(
      and(
        isNotNull(transactionTable.type),
        eq(transactionTable.is_categorizable, true),
        isNull(transactionTable.deleted_at)
      )
    )
    .orderBy(transactionTable.type);

/**
 * Retrieve external transactions by date range, category and merchant
 */
export const getExternalTransactions = <T extends SelectedFields>({
  select,
  range,
  category,
  merchant,
}: {
  select: T;
  range: Prettify<Partial<Interval<Date, Date>>>;
  category?: string;
  merchant?: string;
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
          : undefined,
        merchant
          ? eq(transactionExternalTable.description, merchant)
          : undefined
      )
    );
