import { transactionExternalTable } from 'afinia-common/schema';
import { eq } from 'drizzle-orm';
import { db } from './client';

export const getMerchantByName = async (merchant: string) => {
  const result = await db
    .select({ name: transactionExternalTable.description })
    .from(transactionExternalTable)
    .where(eq(transactionExternalTable.description, merchant))
    .limit(1);

  return result;
};
