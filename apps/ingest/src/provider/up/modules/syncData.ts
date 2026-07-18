import { checkDatabaseConnection } from '@/src/db/connection';
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
import { TransactionResource } from 'afinia-common/providers/up';
import { fileURLToPath } from 'node:url';
import pLimit from 'p-limit';
import { upClient } from '../utils/clients';
import { compareProviderAndDb } from '../utils/compare';
import { ALERT_LEVEL, DEFAULT_PAGE_SIZE } from '../utils/constants';
import { getNextPage, isRateLimitReached } from '../utils/fetch';
import { notify } from '../utils/notify';
import { processTags } from './processTags';

const PROCESS_NAME = 'syncData';

const MAX_CONCURRENCY = 8;

const updateTransaction = async (
  providerId: string,
  updateFn: (transactionId: number) => Promise<unknown>
) => {
  const transaction = await getTransactionByProviderId(providerId);
  if (!transaction || !transaction[0]) {
    await notify(
      ALERT_LEVEL.ERROR,
      `Unable to find transaction with provider id: ${providerId}`
    );
    return;
  }

  const { id: transactionId } = transaction[0];
  await updateFn(transactionId);
};

/**
 * Syncs categorised transactions from Up to database
 * @returns whether the sync was completed in full
 */
const syncCategorisedTransactions = async (): Promise<boolean> => {
  try {
    // Fetch categories from Up API
    // No pagination required - all categories are returned in a single response
    const { data, error } = await upClient.GET('/categories');
    if (error) {
      console.error(error);
      await notify(ALERT_LEVEL.WARN, `[Up] Failed to fetch categories`);
      return false;
    }
    if (!data) {
      return false;
    }

    // No categories to sync
    if (!data.data.length) {
      return true;
    }

    // Sync only child categories - filter out parent categories
    const categories = data.data.filter(
      (category) => category.relationships.parent.data !== null
    );

    // Sync transactions for each category concurrently
    const limit = pLimit(MAX_CONCURRENCY);
    const compareCategorisedTransactions = categories.map(
      ({ type, id: categoryId }) =>
        limit(async () => {
          try {
            console.log(`Syncing transactions for category: ${categoryId}`);
            const externalTransactionIds: string[] = [];
            const CURRENT_PAGE = 1;
            let paginationComplete = false;

            if (type !== 'categories') {
              await notify(
                ALERT_LEVEL.ERROR,
                `Unexpected type "${type}" for category: ${categoryId}`
              );
              return false;
            }

            // Check category exists in db
            const category = await getCategoryById(categoryId);
            if (!category || category.length !== 1) {
              await notify(
                ALERT_LEVEL.ERROR,
                `Category does not exist in database: ${categoryId}`
              );
              return false;
            }

            // Retrieve transactions by category from provider
            const { data, response, error } = await upClient.GET(
              '/transactions',
              {
                params: {
                  query: {
                    'filter[category]': categoryId,
                    'page[size]': DEFAULT_PAGE_SIZE,
                  },
                },
              }
            );
            if (error) {
              await notify(
                ALERT_LEVEL.WARN,
                `[Up] Failed to fetch transactions for category ${categoryId}: ${JSON.stringify(error)}`
              );
              return false;
            }

            // Process data
            paginationComplete = data?.links?.next === null;
            if (data?.data) {
              externalTransactionIds.push(...data.data.map((t) => t.id));
            }
            // Process subsequent pages if available
            if (data?.links?.next && !isRateLimitReached(response.headers)) {
              const result = await getNextPage<TransactionResource>(
                data.links.next,
                (transactions) =>
                  Promise.resolve(
                    externalTransactionIds.push(
                      ...transactions.map((t) => t.id)
                    )
                  ),
                // Next page of data, page 2
                CURRENT_PAGE + 1
              );
              paginationComplete = result.complete;
            }
            if (!paginationComplete) {
              console.warn(
                `[${PROCESS_NAME}] Failed to retrieve all transactions for category ${categoryId}: categorised transaction sync incomplete`
              );
              return false;
            }

            const transactionsByCategory =
              await getTransactionsByCategory(categoryId);
            const { inserted, deleted } = await compareProviderAndDb({
              providerData: externalTransactionIds,
              dbData: transactionsByCategory.map((t) => t.providerId),
              insertToDb: (providerId) =>
                updateTransaction(providerId, (transactionId) =>
                  updateTransactionCategory(
                    transactionId,
                    categoryId,
                    PROCESS_NAME
                  )
                ),
              deleteFromDb: (providerId) =>
                updateTransaction(providerId, (transactionId) =>
                  updateTransactionCategory(transactionId, null, PROCESS_NAME)
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

            return paginationComplete;
          } catch (error) {
            console.error(error);
            await notify(
              ALERT_LEVEL.ERROR,
              `Failed to sync transactions for category ${categoryId}: ${
                error instanceof Error ? error.message : error
              }`
            );
            return false;
          }
        })
    );

    const results = await Promise.all(compareCategorisedTransactions);
    // Return success if all categorised transactions were synced successfully
    return results.every((success) => success);
  } catch (error) {
    console.error(error);
    await notify(ALERT_LEVEL.ERROR, `Failed to sync categorised transactions`);
    return false;
  }
};

/**
 * Syncs tagged transactions from Up to database
 * @returns whether the sync was completed in full
 */
const syncTaggedTransactions = async (): Promise<boolean> => {
  try {
    const allTags: { type: string; id: string }[] = [];
    const CURRENT_PAGE = 1;
    let paginationComplete = false;
    // Fetch tags from Up API
    const { data: tagsPage, response, error } = await upClient.GET('/tags');

    if (error) {
      console.error(error);
      await notify(
        ALERT_LEVEL.ERROR,
        `[Up] Failed to fetch tags: ${JSON.stringify(error)}`
      );
      return false;
    }
    if (!tagsPage) {
      return false;
    }

    // Process data
    paginationComplete = tagsPage.links?.next === null;
    if (tagsPage.data?.length) {
      allTags.push(...tagsPage.data);
    }
    // Process subsequent pages if available
    if (tagsPage.links?.next) {
      if (isRateLimitReached(response.headers)) {
        console.warn(`[${PROCESS_NAME}] Rate limit reached after page 1`);
      } else {
        const result = await getNextPage<{ type: string; id: string }>(
          tagsPage.links.next,
          async (tags) => {
            allTags.push(...tags);
          },
          CURRENT_PAGE + 1
        );
        paginationComplete = result.complete;
      }
    }
    if (!paginationComplete) {
      console.warn(
        `[${PROCESS_NAME}] Failed to retrieve all tags: tagged transaction sync incomplete`
      );
      return false;
    }

    // No tags to sync
    if (!allTags.length) {
      return true;
    }

    // Sync transactions for each tag concurrently
    const limit = pLimit(MAX_CONCURRENCY);
    const compareTaggedTransactions = allTags.map(({ type, id: tagId }) =>
      limit(async () => {
        try {
          console.log(`Syncing transactions for tag: ${tagId}`);
          const externalTransactionIds: string[] = [];
          const CURRENT_PAGE = 1;
          let paginationComplete = false;

          if (type !== 'tags') {
            await notify(
              ALERT_LEVEL.ERROR,
              `Unexpected type "${type}" for tag: ${tagId}`
            );
            return false;
          }

          // Check tag exists in db
          const tag = await getTag(tagId);
          if (!tag || tag.length !== 1) {
            await notify(
              ALERT_LEVEL.ERROR,
              `Tag does not exist in database: ${tagId}`
            );
            return false;
          }

          // Retrieve transactions by tag from provider
          const { data, response, error } = await upClient.GET(
            '/transactions',
            {
              params: {
                query: {
                  'filter[tag]': tagId,
                  'page[size]': DEFAULT_PAGE_SIZE,
                },
              },
            }
          );
          if (error) {
            console.error(error);
            await notify(
              ALERT_LEVEL.WARN,
              `[Up] Failed to fetch transactions for tag ${tagId}`
            );
            return false;
          }

          // Process data
          paginationComplete = data?.links?.next === null;
          if (data?.data) {
            externalTransactionIds.push(...data.data.map((t) => t.id));
          }
          // Process subsequent pages if available
          if (data?.links?.next && !isRateLimitReached(response.headers)) {
            const result = await getNextPage<TransactionResource>(
              data.links.next,
              (transactions) =>
                Promise.resolve(
                  externalTransactionIds.push(...transactions.map((t) => t.id))
                ),
              // Next page of data, page 2
              CURRENT_PAGE + 1
            );
            paginationComplete = result.complete;
          }

          if (!paginationComplete) {
            console.warn(
              `[${PROCESS_NAME}] Failed to retrieve all transactions for tag ${tagId}: tagged transaction sync incomplete`
            );
            return false;
          }

          // Retrieve transactions by tag from db
          const transactionsByTag = await getTransactionsByTag(tagId);

          // Insert or delete relationship between tags and transactions
          const { inserted, deleted } = await compareProviderAndDb({
            providerData: externalTransactionIds,
            dbData: transactionsByTag.map((t) => t.providerId),
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

          return paginationComplete;
        } catch (error) {
          console.error(error);
          await notify(
            ALERT_LEVEL.ERROR,
            `Failed to sync transactions for tag ${tagId}`
          );
          return false;
        }
      })
    );

    const results = await Promise.all(compareTaggedTransactions);

    // Return success if all tagged transactions were synced successfully
    return results.every((success) => success);
  } catch (error) {
    console.error(error);
    await notify(ALERT_LEVEL.ERROR, `Failed to sync tagged transactions`);
    return false;
  }
};

export const handler = async () => {
  try {
    // Check database connection
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      await notify(
        ALERT_LEVEL.ERROR,
        `Failed to connect to database. Skipping ${PROCESS_NAME}`
      );
      return;
    }

    // Sync tags
    const tagsSynced = await processTags();
    // Sync tagged transactions
    const taggedTransactionsSynced = await syncTaggedTransactions();
    // Sync categorised transactions
    const categorisedTransactionsSynced = await syncCategorisedTransactions();

    if (
      ![
        tagsSynced,
        taggedTransactionsSynced,
        categorisedTransactionsSynced,
      ].every((success) => success)
    ) {
      await notify(ALERT_LEVEL.WARN, `[${PROCESS_NAME}] Failed sync`);
    }

    console.info(`[${PROCESS_NAME}] Sync Status: 
      Tags: ${tagsSynced ? 'Success' : 'Incomplete'}
      Tagged Transactions: ${taggedTransactionsSynced ? 'Success' : 'Incomplete'}
      Categorised Transactions: ${categorisedTransactionsSynced ? 'Success' : 'Incomplete'}
    `);
  } catch (error) {
    console.error(error);
    await notify(ALERT_LEVEL.ERROR, `[${PROCESS_NAME}] Failed sync`);
  }
};

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  handler()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error during syncData execution:', error);
      process.exit(1);
    });
}
