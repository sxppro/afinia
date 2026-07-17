import { checkDatabaseConnection } from '@/src/db/connection';
import { TransactionResource } from 'afinia-common/providers/up';
import { subDays } from 'date-fns';
import { fileURLToPath } from 'node:url';
import {
  emptyMetrics,
  hasMissingData,
  upsertTransactions,
} from '../common/transaction';
import { upClient } from '../utils/clients';
import { ALERT_LEVEL, DEFAULT_PAGE_SIZE } from '../utils/constants';
import { getNextPage, isRateLimitReached } from '../utils/fetch';
import { notify } from '../utils/notify';
import { processAccounts } from './processAccounts';
import { processCategories } from './processCategories';
import { processTags } from './processTags';

const PROCESS_NAME = 'syncRecent';
const DAYS_TO_SYNC = 30;

/**
 * Sync recent transactions from Up to database
 */
export const handler = async () => {
  const metrics = emptyMetrics();

  try {
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      await notify(
        ALERT_LEVEL.ERROR,
        `[${PROCESS_NAME}] Failed to connect to database: skipping recent transaction sync`
      );
      return;
    }

    const timestamp = subDays(new Date(), DAYS_TO_SYNC).toISOString();
    const transactionPages: TransactionResource[][] = [];
    const CURRENT_PAGE = 1;
    let paginationComplete = false;

    console.log(
      `[Up] Fetching recent transactions from ${timestamp} (last ${DAYS_TO_SYNC} days)`
    );

    // Fetch transactions from Up API
    const { data, response, error } = await upClient.GET('/transactions', {
      params: {
        query: {
          'filter[since]': timestamp,
          'page[size]': DEFAULT_PAGE_SIZE,
        },
      },
    });

    if (error) {
      console.error(error);
      await notify(
        ALERT_LEVEL.ERROR,
        `[Up] Failed to fetch recent transactions: ${JSON.stringify(error)}`
      );
      return;
    }
    if (!data) {
      return;
    }

    // Process data
    paginationComplete = data?.links?.next === null;
    if (data.data) {
      transactionPages.push(data.data);
      await upsertTransactions(data.data, CURRENT_PAGE, metrics, PROCESS_NAME);
    }
    // Process subsequent pages if available
    if (data?.links?.next) {
      if (isRateLimitReached(response.headers)) {
        console.warn(`[${PROCESS_NAME}] Rate limit reached after page 1`);
      } else {
        const result = await getNextPage<TransactionResource>(
          data.links.next,
          async (txns, page) => {
            transactionPages.push(txns);
            await upsertTransactions(txns, page, metrics, PROCESS_NAME);
          },
          CURRENT_PAGE + 1
        );
        paginationComplete = result.complete;
      }
    }

    if (!paginationComplete) {
      await notify(
        ALERT_LEVEL.WARN,
        `[${PROCESS_NAME}] Failed to retrieve all recent transactions: transaction sync incomplete`
      );
      return;
    }

    // Re-sync accounts, categories and tags if any are missing
    if (hasMissingData(metrics) && transactionPages.length > 0) {
      console.warn(
        `[${PROCESS_NAME}] Missing data detected after sync: re-syncing accounts, categories and tags and attempting to process transactions again`,
        {
          missingAccounts: Array.from(metrics.errors.missingAccounts),
          missingCategories: Array.from(metrics.errors.missingCategories),
          missingTags: Array.from(metrics.errors.missingTags),
        }
      );

      await processAccounts();
      await processCategories();
      await processTags();

      const retryMetrics = emptyMetrics();
      retryMetrics.startTime = metrics.startTime;

      for (let i = 0; i < transactionPages.length; i++) {
        const pageTxns = transactionPages[i];
        if (!pageTxns) continue;
        await upsertTransactions(pageTxns, i + 1, retryMetrics, PROCESS_NAME);
      }

      metrics.pages = retryMetrics.pages;
      metrics.transactions = retryMetrics.transactions;
      metrics.errors = retryMetrics.errors;
    }

    metrics.endTime = Date.now();
    const totalTime = metrics.endTime - metrics.startTime;
    const avgPageTime =
      metrics.pages.timings.length > 0
        ? Math.round(
            metrics.pages.timings.reduce((a, b) => a + b, 0) /
              metrics.pages.timings.length
          )
        : 0;

    console.log(`Finished ${PROCESS_NAME}: `, {
      since: timestamp,
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
  } catch (error) {
    metrics.endTime = Date.now();
    console.error(`Error in ${PROCESS_NAME}: `, {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      metrics: {
        pages: metrics.pages.processed,
        transactions: metrics.transactions,
        missingAccounts: Array.from(metrics.errors.missingAccounts),
        missingCategories: Array.from(metrics.errors.missingCategories),
        missingTags: Array.from(metrics.errors.missingTags),
      },
    });
    await notify(ALERT_LEVEL.ERROR, `${PROCESS_NAME} failed`);
  }
};

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  handler()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error during syncRecent execution:', error);
      process.exit(1);
    });
}
