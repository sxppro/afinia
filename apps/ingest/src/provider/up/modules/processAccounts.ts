import { db } from '@/src/db/client';
import { components } from 'afinia-common/providers/up';
import { accountTable } from 'afinia-common/schema';
import { InferInsertModel } from 'drizzle-orm';
import { upClient } from '../utils/clients';
import { ALERT_LEVEL } from '../utils/constants';
import { getNextPage, isRateLimitReached } from '../utils/fetch';
import { notify } from '../utils/notify';
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

/**
 * Syncs accounts from Up to database
 * @returns whether the sync was completed in full
 */
export const processAccounts = async (): Promise<boolean> => {
  try {
    const CURRENT_PAGE = 1;
    let paginationComplete = false;
    // Fetch accounts from Up API
    const { data, response, error } = await upClient.GET('/accounts');

    if (error) {
      console.error(error);
      await notify(
        ALERT_LEVEL.ERROR,
        `[Up] Failed to fetch accounts: ${JSON.stringify(error)}`
      );
      return false;
    }
    if (!data) {
      return false;
    }

    // Process data
    paginationComplete = data.links?.next === null;
    if (data.data) {
      await upsertAccounts(data.data, CURRENT_PAGE);
    }
    // Process subsequent pages if available
    if (data.links?.next) {
      if (isRateLimitReached(response.headers)) {
        console.warn(`[${PROCESS_NAME}] Rate limit reached after page 1`);
      } else {
        const result = await getNextPage<
          components['schemas']['AccountResource']
        >(data.links.next, upsertAccounts, CURRENT_PAGE + 1);
        paginationComplete = result.complete;
      }
    }

    if (!paginationComplete) {
      console.warn(
        `[${PROCESS_NAME}] Failed to retrieve all accounts: account sync incomplete`
      );
    }

    return paginationComplete;
  } catch (error) {
    console.error(`Error in ${PROCESS_NAME}: `, error);
    return false;
  }
};
