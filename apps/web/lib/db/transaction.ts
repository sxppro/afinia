import { transactionExternalTable } from 'afinia-common/schema';
import { sql } from 'drizzle-orm';
import { db } from './client';

export const getTransactionsBySearchQuery = (query: string) =>
  db
    .select()
    .from(transactionExternalTable)
    .where(
      sql`${transactionExternalTable.text_search} @@ websearch_to_tsquery('english', ${query})`
    );
