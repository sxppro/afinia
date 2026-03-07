import { transactionExternalTable } from 'afinia-common/schema';
import { and, desc, eq, or, SQL, sql } from 'drizzle-orm';
import { db } from './client';

export const getTransactions = ({
  categoryId,
  searchTerm,
  limit,
}: {
  categoryId?: string;
  searchTerm?: string;
  limit: number;
}) => {
  const filters: (SQL | undefined)[] = [];

  if (categoryId) {
    filters.push(
      or(
        eq(transactionExternalTable.category_id, categoryId),
        eq(transactionExternalTable.category_parent_id, categoryId)
      )
    );
  }

  if (searchTerm) {
    filters.push(
      sql`${transactionExternalTable.text_search} @@ websearch_to_tsquery('english', ${searchTerm})`
    );
  }

  return db
    .select()
    .from(transactionExternalTable)
    .where(and(...filters))
    .orderBy(desc(transactionExternalTable.created_at))
    .limit(limit);
};
