import { getCategoryById } from '@/src/db/queries/category';
import { getTag } from '@/src/db/queries/tag';
import {
  deleteTransactionTag,
  getTransactionByProviderId,
  getTransactionsByCategory,
  getTransactionsByTag,
  updateTransactionCategory,
  updateTransactionTag,
} from '@/src/db/queries/transaction';
import { TransactionResource } from 'afinia-common/types/up-api/overrides';
import { fileURLToPath } from 'node:url';
import { upClient } from '../utils/clients';
import { compareProviderAndDb } from '../utils/compare';
import { ALERT_LEVEL } from '../utils/constants';
import { getNextPage } from '../utils/fetch';
import { notify } from '../utils/notify';
import { processTags } from './processTags';

const updateTransaction = async (
  providerId: string,
  updateFn: (transactionId: number) => Promise<unknown>
) => {
  const transaction = await getTransactionByProviderId(providerId);
  if (!transaction || !transaction[0]) {
    notify(
      ALERT_LEVEL.ERROR,
      `Unable to find transaction with provider id: ${providerId}`
    );
    return;
  }

  const { id: transactionId } = transaction[0];
  await updateFn(transactionId);
};

const syncCategorisedTransactions = async () => {
  const { data } = await upClient.GET('/categories');
  if (!data || !data.data.length) {
    return;
  }

  // Filter out parent categories
  const categories = data?.data.filter(
    (category) => category.relationships.parent.data !== null
  );

  const compareCategorisedTransactions = categories?.map(
    async ({ type, id: categoryId }) => {
      try {
        console.log(`Syncing transactions for category: ${categoryId}`);
        const externalTransactionIds: string[] = [];
        if (type !== 'categories') {
          notify(
            ALERT_LEVEL.ERROR,
            `Unexpected type "${type}" for category: ${categoryId}`
          );
          return;
        }

        // Check category exists in db
        const category = await getCategoryById(categoryId);
        if (!category || category.length !== 1) {
          notify(
            ALERT_LEVEL.ERROR,
            `Category does not exist in database: ${categoryId}`
          );
          return;
        }

        // Retrieve transactions by category from provider
        const { data } = await upClient.GET('/transactions', {
          params: {
            query: {
              'filter[category]': categoryId,
            },
          },
        });
        if (data?.data) {
          externalTransactionIds.push(...data.data.map((t) => t.id));
        }
        if (data?.links.next) {
          await getNextPage<TransactionResource>(
            data.links.next,
            (transactions) =>
              Promise.resolve(
                externalTransactionIds.push(...transactions.map((t) => t.id))
              ),
            // Next page of data, page 2
            2
          );
        }

        const transactionsByCategory = await getTransactionsByCategory(
          categoryId
        );
        const { inserted, deleted } = await compareProviderAndDb({
          providerData: externalTransactionIds,
          dbData: transactionsByCategory?.map((t) => t.providerId),
          insertToDb: (providerId) =>
            updateTransaction(providerId, (transactionId) =>
              updateTransactionCategory(transactionId, categoryId)
            ),
          deleteFromDb: (providerId) =>
            updateTransaction(providerId, (transactionId) =>
              updateTransactionCategory(transactionId, null)
            ),
        });
        if (inserted > 0) {
          console.log(
            `Categorised ${inserted} transactions under "${categoryId}"`
          );
        }
        if (deleted > 0) {
          console.log(
            `Uncategorised ${deleted} transactions from "${categoryId}"`
          );
        }
        console.log(
          `Finished syncing transactions for category: ${categoryId}`
        );
      } catch (error) {
        notify(
          ALERT_LEVEL.ERROR,
          `Failed to sync transactions for category ${categoryId}: ${
            error instanceof Error ? error.message : error
          }`
        );
      }
    }
  );

  await Promise.all(compareCategorisedTransactions);
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
        const externalTransactionIds: string[] = [];
        if (type !== 'tags') {
          notify(
            ALERT_LEVEL.ERROR,
            `Unexpected type "${type}" for tag: ${tagId}`
          );
          return;
        }

        // Check tag exists in db
        const tag = await getTag(tagId);
        if (!tag || tag.length !== 1) {
          notify(ALERT_LEVEL.ERROR, `Tag does not exist in database: ${tagId}`);
          return;
        }

        // Retrieve transactions by tag from provider
        const { data } = await upClient.GET('/transactions', {
          params: {
            query: {
              'filter[tag]': tagId,
            },
          },
        });
        if (data?.data) {
          externalTransactionIds.push(...data.data.map((t) => t.id));
        }
        if (data?.links.next) {
          await getNextPage<TransactionResource>(
            data.links.next,
            (transactions) =>
              Promise.resolve(
                externalTransactionIds.push(...transactions.map((t) => t.id))
              ),
            // Next page of data, page 2
            2
          );
        }
        // Retrieve transactions by tag from db
        const transactionsByTag = await getTransactionsByTag(tagId);

        // Insert or delete relationship between tags and transactions
        const { inserted, deleted } = await compareProviderAndDb({
          providerData: externalTransactionIds,
          dbData: transactionsByTag?.map((t) => t.providerId),
          insertToDb: (providerId) =>
            updateTransaction(providerId, (transactionId) =>
              updateTransactionTag(transactionId, tagId)
            ),
          deleteFromDb: (providerId) =>
            updateTransaction(providerId, (transactionId) =>
              deleteTransactionTag(transactionId, tagId)
            ),
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
  await syncCategorisedTransactions();
};

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  handler()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error during syncData execution:', error);
      process.exit(1);
    });
}
