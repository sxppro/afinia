import { transactionExternalTable } from 'afinia-common/schema';
import { sql } from 'drizzle-orm';
import { db } from './client';

export const getTransactionsBySearchQuery = (query: string) =>
  db.select().from(transactionExternalTable).where(sql`
    to_tsvector(coalesce(${transactionExternalTable.description}, '') || ' ' ||
    coalesce(${transactionExternalTable.raw_text}, '') || '' ||
    coalesce(${transactionExternalTable.message}, '') || ' ' ||
    coalesce(${transactionExternalTable.note}, '')) 
    @@ websearch_to_tsquery(${query})`);
