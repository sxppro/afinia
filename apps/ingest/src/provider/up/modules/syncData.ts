import { getTag } from '@/src/db/queries/tag';
import {
  deleteTransactionTag,
  getTransactionByProviderId,
  getTransactionsByTag,
  updateTransactionTag,
} from '@/src/db/queries/transaction';
import { TransactionResource } from 'afinia-common/types/up-api/overrides';
import { upClient } from '../utils/clients';
import { compareProviderAndDb } from '../utils/compare';
import { ALERT_LEVEL } from '../utils/constants';
import { getNextPage } from '../utils/fetch';
import { notify } from '../utils/notify';
import { processTags } from './processTags';

const tagTransaction = async (providerId: string, tagId: string) => {
  const transaction = await getTransactionByProviderId(providerId);
  if (!transaction || !transaction[0]) {
    notify(
      ALERT_LEVEL.ERROR,
      `Attempted to tag transaction with provider id, but it does not exist in database: ${providerId}`
    );
    return;
  }

  const { id: transactionId } = transaction[0];
  await updateTransactionTag(transactionId, tagId);
};

const untagTransaction = async (providerId: string, tagId: string) => {
  const transaction = await getTransactionByProviderId(providerId);
  if (!transaction || !transaction[0]) {
    notify(
      ALERT_LEVEL.ERROR,
      `Attempted to untag transaction with provider id, but it does not exist in database: ${providerId}`
    );
    return;
  }

  const { id: transactionId } = transaction[0];
  await deleteTransactionTag(transactionId, tagId);
};

const syncCategorisedTransactions = async () => {
  const { data: categories } = await upClient.GET('/categories');
  if (!categories || !categories.data.length) {
    notify(ALERT_LEVEL.WARN, `Failed to fetch categories`);
    return;
  }
};

const syncTaggedTransactions = async () => {
  const { data: tags } = await upClient.GET('/tags');

  if (!tags || !tags.data.length) {
    return;
  }

  const compareTaggedTransactions = tags.data.map(
    async ({ type, id: tagId }) => {
      try {
        console.log(`Syncing transactions for tag: ${tagId}`);
        const externalTransactionsByTag: TransactionResource[] = [];
        if (type !== 'tags') {
          notify(
            ALERT_LEVEL.ERROR,
            `Unexpected type ${type} for tag: ${tagId}`
          );
          return;
        }

        // Check tag exists in db
        const tag = await getTag(tagId);
        if (!tag || tag.length !== 1) {
          notify(ALERT_LEVEL.ERROR, `Tag does not exist in database: ${tagId}`);
          return;
        }

        // Retrieve transactions by tag from Up
        const { data } = await upClient.GET('/transactions', {
          params: {
            query: {
              'filter[tag]': tagId,
            },
          },
        });
        if (data?.data) {
          externalTransactionsByTag.push(...data.data);
        }
        if (data?.links?.next) {
          await getNextPage<TransactionResource>(
            data.links.next,
            (transactions) =>
              Promise.resolve(externalTransactionsByTag.push(...transactions)),
            // Next page of data, page 2
            2
          );
        }
        // Retrieve transactions by tag from db
        const transactionsByTag = await getTransactionsByTag(tagId);

        // Insert or delete relationship between tags and transactions
        const { inserted, deleted } = await compareProviderAndDb({
          providerData: externalTransactionsByTag?.map((t) => t.id),
          dbData: transactionsByTag?.map((t) => t.providerId),
          insertToDb: (providerId) => tagTransaction(providerId, tagId),
          deleteFromDb: (providerId) => untagTransaction(providerId, tagId),
        });
        if (inserted > 0) {
          console.log(`Tagged ${inserted} transactions with "${tagId}"`);
        }
        if (deleted > 0) {
          console.log(`Untagged ${deleted} transactions from "${tagId}"`);
        }
        console.log(`Finished syncing transactions for tag: ${tagId}`);
      } catch (error) {
        notify(
          ALERT_LEVEL.ERROR,
          `Failed to sync transactions for tag ${tagId}: ${
            error instanceof Error ? error.message : error
          }`
        );
      }
    }
  );

  await Promise.all(compareTaggedTransactions);
};

export const handler = async () => {
  // Sync tags
  await processTags();
  // Sync tagged transactions
  await syncTaggedTransactions();
  // Sync categorised transactions
  // await syncCategorisedTransactions();
};
