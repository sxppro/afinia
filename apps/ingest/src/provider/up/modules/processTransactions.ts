import { TransactionResource } from 'afinia-common/providers/up';
import {
  deleteTransaction,
  emptyMetrics,
  hasMissingData,
  ProcessTransactionsMetrics,
  upsertTransactions,
} from '../common/transaction';
import { summariseTransactionChanges } from '../utils/changes';
import { upClient } from '../utils/clients';
import { ALERT_LEVEL, DEFAULT_PAGE_SIZE } from '../utils/constants';
import { getNextPage, isRateLimitReached } from '../utils/fetch';
import { notify } from '../utils/notify';
import { processAccounts } from './processAccounts';
import { processCategories } from './processCategories';
import { processTags } from './processTags';

/**
 * Sync all transactions from Up to database
 * @returns whether the sync was completed in full
 */
export const processTransactions = async (): Promise<boolean> => {
  const PROCESS_NAME = 'processTransactions';
  const metrics = emptyMetrics();

  try {
    const CURRENT_PAGE = 1;
    let paginationComplete = false;
    // Fetch transactions from Up API
    const { data, response, error } = await upClient.GET('/transactions', {
      params: {
        query: {
          'page[size]': DEFAULT_PAGE_SIZE,
        },
      },
    });

    if (error) {
      await notify(
        ALERT_LEVEL.WARN,
        `[Up] Failed to fetch transactions: ${JSON.stringify(error)}`
      );
      return false;
    }
    if (!data) {
      return false;
    }

    // Process data
    paginationComplete = data?.links?.next === null;
    if (data.data) {
      await upsertTransactions(data.data, CURRENT_PAGE, metrics, PROCESS_NAME);
    }
    // Process subsequent pages if available
    if (data.links?.next) {
      if (isRateLimitReached(response.headers)) {
        console.warn(`[${PROCESS_NAME}] Rate limit reached after page 1`);
      } else {
        const result = await getNextPage<TransactionResource>(
          data.links.next,
          (txns, page) => upsertTransactions(txns, page, metrics, PROCESS_NAME),
          CURRENT_PAGE + 1
        );
        paginationComplete = result.complete;
      }
    }

    if (!paginationComplete) {
      console.warn(
        `[${PROCESS_NAME}] Failed to retrieve all transactions: transaction sync incomplete`
      );
    }

    /**
     * Metrics
     */
    metrics.endTime = Date.now();
    const totalTime = metrics.endTime - metrics.startTime;
    const avgPageTime =
      metrics.pages.timings.length > 0
        ? Math.round(
            metrics.pages.timings.reduce((a, b) => a + b, 0) /
              metrics.pages.timings.length
          )
        : 0;
    console.log('Finished processing transactions: ', {
      pages: metrics.pages.processed,
      transactions: {
        total: metrics.transactions.total,
        processed: metrics.transactions.processed,
        skipped: metrics.transactions.skipped,
      },
      errors: {
        missingAccounts: Array.from(metrics.errors.missingAccounts),
        missingCategories: Array.from(metrics.errors.missingCategories),
        missingTags: Array.from(metrics.errors.missingTags),
      },
      changes: summariseTransactionChanges(metrics.changes),
      stats: {
        total: `${totalTime}ms`,
        avg: `${avgPageTime}ms`,
        min:
          metrics.pages.timings.length > 0
            ? `${Math.min(...metrics.pages.timings)}ms`
            : 'N/A',
        max:
          metrics.pages.timings.length > 0
            ? `${Math.max(...metrics.pages.timings)}ms`
            : 'N/A',
      },
    });

    return paginationComplete;
  } catch (error) {
    metrics.endTime = Date.now();
    console.error(`Error in ${PROCESS_NAME}: `, {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      metrics: {
        missingAccounts: Array.from(metrics.errors.missingAccounts),
        missingCategories: Array.from(metrics.errors.missingCategories),
        missingTags: Array.from(metrics.errors.missingTags),
      },
    });
    throw error;
  }
};

/**
 * Process a transaction
 * @param operation - Insert or delete a transaction
 * @param transactionId - The provider ID of the transaction
 * @returns metrics
 */
export const processTransaction = async (
  operation: 'insert' | 'delete',
  transactionId: string
): Promise<ProcessTransactionsMetrics> => {
  const PROCESS_NAME = 'processTransaction';
  const metrics = emptyMetrics();

  try {
    if (operation === 'delete') {
      await deleteTransaction(transactionId, PROCESS_NAME, undefined, metrics);
      await notify(ALERT_LEVEL.WARN, `Transaction deleted: ${transactionId}`);
      metrics.endTime = Date.now();
      return metrics;
    }

    // Insert: retrieve transaction details
    const { data, error } = await upClient.GET('/transactions/{id}', {
      params: {
        path: {
          id: transactionId,
        },
      },
    });
    if (error) {
      await notify(
        ALERT_LEVEL.ERROR,
        `[Up] Failed to fetch transaction (${transactionId}): ${JSON.stringify(error)}`
      );
      metrics.endTime = Date.now();
      return metrics;
    }

    await upsertTransactions([data.data], 1, metrics, PROCESS_NAME);

    /**
     * Try inserting the transaction again after
     * syncing accounts, categories and tags
     */
    if (hasMissingData(metrics)) {
      console.log(
        `[${PROCESS_NAME}] Missing data detected for ${transactionId}: re-syncing accounts, categories and tags and attempting to process transaction again`
      );
      await processAccounts();
      await processCategories();
      await processTags();

      const retryMetrics = emptyMetrics();
      retryMetrics.startTime = metrics.startTime;

      await upsertTransactions([data.data], 1, retryMetrics, PROCESS_NAME);

      metrics.pages = retryMetrics.pages;
      metrics.transactions = retryMetrics.transactions;
      metrics.errors = retryMetrics.errors;
      metrics.changes.push(...retryMetrics.changes);
    }

    metrics.endTime = Date.now();
    return metrics;
  } catch (error) {
    metrics.endTime = Date.now();
    console.error(`Error in ${PROCESS_NAME}: `, {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      metrics: {
        missingAccounts: Array.from(metrics.errors.missingAccounts),
        missingCategories: Array.from(metrics.errors.missingCategories),
        missingTags: Array.from(metrics.errors.missingTags),
      },
    });
    throw error;
  }
};
