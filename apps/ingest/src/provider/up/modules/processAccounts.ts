import { db } from '@/src/db/client';
import { accountTable } from '@/src/db/schema';
import { upClient } from 'afinia-common/clients';
import { components } from 'afinia-common/types/up-api';
import { InferInsertModel } from 'drizzle-orm';
import { getNextPage } from '../utils/fetch';
import { buildConflictUpdateColumns } from '../utils/upsert';

const PROCESS_NAME = 'processAccounts';

const upsertAccounts = async (
  accounts: components['schemas']['AccountResource'][],
  page: number
) => {
  const remap = (
    account: components['schemas']['AccountResource']
  ): InferInsertModel<typeof accountTable> => {
    const { attributes } = account;
    return {
      provider_id: account.id,
      type: attributes.accountType,
      ownership_type: attributes.ownershipType,
      display_name: attributes.displayName,
      currency_code: attributes.balance.currencyCode,
      value: attributes.balance.value,
      value_in_base_units: attributes.balance.valueInBaseUnits,
      created_at: new Date(attributes.createdAt),
      updated_at: new Date(),
      updated_by: PROCESS_NAME,
    };
  };
  console.log(`Processing accounts: page ${page}`);
  await db
    .insert(accountTable)
    .values(accounts.map(remap))
    .onConflictDoUpdate({
      target: accountTable.provider_id,
      set: {
        ...buildConflictUpdateColumns(accountTable, [
          'type',
          'ownership_type',
          'display_name',
          'currency_code',
          'value',
          'value_in_base_units',
        ]),
        updated_at: new Date(),
        updated_by: PROCESS_NAME,
      },
    });
  console.log(`Finished processing accounts: page ${page}`);
};

export const processAccounts = async () => {
  try {
    // Fetch accounts from Up API
    const { data } = await upClient.GET('/accounts');
    const CURRENT_PAGE = 1;

    if (data) {
      // Process initial page
      if (data.data) {
        await upsertAccounts(data.data, CURRENT_PAGE);
      }
      // Process subsequent pages
      if (data?.links?.next) {
        await getNextPage<components['schemas']['AccountResource']>(
          data.links.next,
          upsertAccounts,
          CURRENT_PAGE + 1
        );
      }
    }
  } catch (error) {
    console.error(`Error in ${PROCESS_NAME}: `, error);
  }
};
