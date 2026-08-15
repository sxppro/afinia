import { transactionTable } from 'afinia-common/schema';
import { and, eq, isNotNull, isNull } from 'drizzle-orm';
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
