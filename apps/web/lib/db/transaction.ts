import { transactionExternalTable } from 'afinia-common/schema';
import { desc, sql } from 'drizzle-orm';
import { db } from './client';

export const getTransactions = (limit: number) =>
  db
    .select()
    .from(transactionExternalTable)
    .orderBy(desc(transactionExternalTable.created_at))
    .limit(limit);

export const getTransactionsBySearchQuery = (query: string) =>
  db
    .select()
    .from(transactionExternalTable)
    .where(
      sql`${transactionExternalTable.text_search} @@ websearch_to_tsquery('english', ${query})`,
    );
