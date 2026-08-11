import { transactionExternalTable } from 'afinia-common/schema';
import { eq } from 'drizzle-orm';
import { db } from './client';

export const getMerchantByName = (merchant: string) =>
  db
    .select({ name: transactionExternalTable.description })
    .from(transactionExternalTable)
    .where(eq(transactionExternalTable.description, merchant))
    .limit(1);
