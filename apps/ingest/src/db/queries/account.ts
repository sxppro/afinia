import { accountTable } from 'afinia-common/schema';
import { isNull, min } from 'drizzle-orm';
import { db } from '../client';

export const getEarliestAccountCreatedAt = async () => {
  const [result] = await db
    .select({ earliest: min(accountTable.created_at) })
    .from(accountTable)
    .where(isNull(accountTable.deleted_at));

  return result;
};
