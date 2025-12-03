import { accountTable } from 'afinia-common/schema';
import { AccountTypeEnum } from 'afinia-common/types/up-api';
import { and, eq, sum } from 'drizzle-orm';
import { SelectedFields } from 'drizzle-orm/pg-core';
import { db } from './client';

export const getAccountBalance = () =>
  db
    .select({ value: sum(accountTable.value_in_base_units).mapWith(Number) })
    .from(accountTable);

export const getAccount = <T extends SelectedFields>(
  select: T,
  {
    id,
    providerId,
    type,
  }: {
    id?: number;
    providerId?: string;
    type?: AccountTypeEnum;
  }
) =>
  db
    .select(select)
    .from(accountTable)
    .where(
      and(
        id ? eq(accountTable.account_id, id) : undefined,
        providerId ? eq(accountTable.provider_id, providerId) : undefined,
        type ? eq(accountTable.type, type) : undefined
      )
    );
