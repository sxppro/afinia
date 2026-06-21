import { accountTable } from 'afinia-common/schema';
import { isNull, sum } from 'drizzle-orm';
import { db } from './client';

export const getAccountBalance = () =>
  db
    .select({ value: sum(accountTable.value_in_base_units).mapWith(Number) })
    .from(accountTable)
    .where(isNull(accountTable.deleted_at));
