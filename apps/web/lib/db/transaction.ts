import { transactionTable } from 'afinia-common/schema';
import { eq } from 'drizzle-orm';
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
