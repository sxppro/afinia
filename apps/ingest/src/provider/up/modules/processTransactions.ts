import { TransactionResource } from 'afinia-common/providers/up';
import {
  deleteTransaction,
  ProcessTransactionsMetrics,
  upsertTransactions,
} from '../common/transaction';
import { upClient } from '../utils/clients';
import { ALERT_LEVEL, RATE_LIMIT_HEADER } from '../utils/constants';
import { getNextPage } from '../utils/fetch';
import { notify } from '../utils/notify';

export const processTransactions = async () => {
  const PROCESS_NAME = 'processTransactions';
  const metrics: ProcessTransactionsMetrics = {
    pages: {
      processed: 0,
      timings: [],
    },
    transactions: {
      total: 0,
      processed: 0,
      skipped: 0,
    },
    errors: {
      missingAccounts: new Set<string>(),
      missingCategories: new Set<string>(),
    },
    startTime: Date.now(),
  };

  try {
    const { data, response, error } = await upClient.GET('/transactions');
    const CURRENT_PAGE = 1;

    /**
     * Track rate limit remaining (number of pages)
     */
    const rateLimitRemaining = response.headers.get(RATE_LIMIT_HEADER);
    if (rateLimitRemaining && parseInt(rateLimitRemaining, 10) === 0) {
      throw new Error('Rate limit exceeded');
    }

    if (error) {
      await notify(
        ALERT_LEVEL.WARN,
        `[Up] Failed to fetch transactions: ${JSON.stringify(error)}`
      );
      return;
    }

    /**
     * Process pages
     */
    if (data) {
      if (data.data) {
        await upsertTransactions(
          data.data,
          CURRENT_PAGE,
          metrics,
          PROCESS_NAME
        );
      }
      if (data.links?.next) {
        await getNextPage<TransactionResource>(
          data.links.next,
          (txns, page) => upsertTransactions(txns, page, metrics, PROCESS_NAME),
          CURRENT_PAGE + 1
        );
      }
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
        missingAccounts: Array.from(metrics.errors.missingAccounts),
        missingCategories: Array.from(metrics.errors.missingCategories),
      },
    });
    throw error;
  }
};

/**
 * Process a transaction
 * @param operation - Insert or delete a transaction
 * @param transactionId - The provider ID of the transaction
 */
export const processTransaction = async (
  operation: 'insert' | 'delete',
  transactionId: string
) => {
  const PROCESS_NAME = 'processTransaction';
  const metrics: ProcessTransactionsMetrics = {
    pages: {
      processed: 0,
      timings: [],
    },
    transactions: {
      total: 0,
      processed: 0,
      skipped: 0,
    },
    errors: {
      missingAccounts: new Set<string>(),
      missingCategories: new Set<string>(),
    },
    startTime: Date.now(),
  };

  try {
    if (operation === 'delete') {
      await deleteTransaction(transactionId, PROCESS_NAME);
      await notify(ALERT_LEVEL.WARN, `Transaction deleted: ${transactionId}`);
    } else {
      // Insert - fetch transaction details
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
        return;
      }
      await upsertTransactions([data.data], 1, metrics, PROCESS_NAME);
    }
    metrics.endTime = Date.now();
    return;
  } catch (error) {
    metrics.endTime = Date.now();
    console.error(`Error in ${PROCESS_NAME}: `, {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      metrics: {
        missingAccounts: Array.from(metrics.errors.missingAccounts),
        missingCategories: Array.from(metrics.errors.missingCategories),
      },
    });
    throw error;
  }
};
