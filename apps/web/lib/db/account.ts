import { accountTable } from 'afinia-common/schema';
import { sum } from 'drizzle-orm';
import { db } from './client';

export const getAccountBalance = async () => {
  return await db
    .select({ value: sum(accountTable.value_in_base_units).mapWith(Number) })
    .from(accountTable);
};
