import { transactionExternalTable } from 'afinia-common/schema';
import { eq, min } from 'drizzle-orm';
import { db } from './client';

export const getMerchantByName = async (merchant: string) => {
  const result = await db
    .select({
      name: transactionExternalTable.description,
      firstTransactionAt: min(transactionExternalTable.created_at).as(
        'first_transaction_at'
      ),
    })
    .from(transactionExternalTable)
    .where(eq(transactionExternalTable.description, merchant))
    .groupBy(transactionExternalTable.description)
    .limit(1);

  return result;
};
