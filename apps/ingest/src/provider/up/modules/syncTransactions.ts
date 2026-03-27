import { db } from '@/src/db/client';
import { getEarliestAccountCreatedAt } from '@/src/db/queries/account';
import { jobStateTable } from 'afinia-common/schema';
import { TransactionResource } from 'afinia-common/types/up-api/overrides';
import {
  addMonths,
  isBefore,
  isEqual,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { eq } from 'drizzle-orm';
import { upClient } from '../utils/clients';
import { ALERT_LEVEL, RATE_LIMIT_HEADER } from '../utils/constants';
import { getNextPage } from '../utils/fetch';
import { notify } from '../utils/notify';
import { processAccounts } from './processAccounts';
import { processCategories } from './processCategories';
import { processTags } from './processTags';
import {
  ProcessTransactionsMetrics,
  upsertTransactions,
} from './processTransactions';

const PROCESS_NAME = 'syncTransactions';
const CURSOR_KEY = 'syncTransactions.cursor';

/**
 * Reads saved timestamp of last synced month
 * @returns
 */
const readCursor = async (): Promise<Date | null> => {
  const [row] = await db
    .select({ value: jobStateTable.value })
    .from(jobStateTable)
    .where(eq(jobStateTable.key, CURSOR_KEY));

  if (!row) return null;
  const parsed = new Date(row.value);
  return isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Saves timestamp of last synced month
 * @param date
 */
const writeCursor = async (date: Date): Promise<void> => {
  await db
    .insert(jobStateTable)
    .values({
      key: CURSOR_KEY,
      value: date.toISOString(),
      updated_at: new Date(),
    })
    .onConflictDoUpdate({
      target: jobStateTable.key,
      set: {
        value: date.toISOString(),
        updated_at: new Date(),
      },
    });
};

/**
 * Calculates the month to sync
 * @param currentMonth - Start of current month, upper bound
 * @returns
 */
const getMonthToSync = async (currentMonth: Date): Promise<Date | null> => {
  const storedCursor = await readCursor();
  const accountCreated = await getEarliestAccountCreatedAt();

  if (!accountCreated) {
    console.error('No accounts found in database.');
    return null;
  }
  if (!accountCreated.earliest) {
    console.error('No account creation date found in database.');
    return null;
  }

  // Lower bound: month of earliest account creation
  const lowerBound = startOfMonth(accountCreated.earliest);

  // No historical months to sync
  if (!isBefore(lowerBound, currentMonth)) {
    return null;
  }

  // If no cursor exists or current month is the same as the cursor, sync the previous month
  if (!storedCursor || isEqual(startOfMonth(storedCursor), currentMonth)) {
    return startOfMonth(subMonths(currentMonth, 1));
  } else if (isBefore(subMonths(storedCursor, 1), lowerBound)) {
    // Wrap around to previous month if subtracting a month would be before earliest account creation
    console.log(
      `${PROCESS_NAME}: Account creation month reached. Wrapping around to previous month`
    );
    return startOfMonth(subMonths(currentMonth, 1));
  } else {
    // Subtract a month from cursor
    return startOfMonth(subMonths(storedCursor, 1));
  }
};

const syncTransactionsForMonth = async (
  start: string,
  end: string,
  metrics: ProcessTransactionsMetrics
) => {
  console.log(`[Up] Fetching transactions from ${start} to ${end}`);

  const { data, response, error } = await upClient.GET('/transactions', {
    params: {
      query: {
        'filter[since]': start,
        'filter[until]': end,
      },
    },
  });

  const rateLimitRemaining = response.headers.get(RATE_LIMIT_HEADER);
  if (rateLimitRemaining && parseInt(rateLimitRemaining, 10) === 0) {
    await notify(ALERT_LEVEL.ERROR, 'Rate limit exceeded');
    return;
  }

  if (error) {
    await notify(
      ALERT_LEVEL.ERROR,
      `[Up] Failed to fetch transactions for ${start} - ${end}: ${JSON.stringify(error)}`
    );
    return;
  }

  if (data) {
    const CURRENT_PAGE = 1;
    if (data.data) {
      await upsertTransactions(data.data, CURRENT_PAGE, metrics, PROCESS_NAME);
    }
    if (data.links?.next) {
      await getNextPage<TransactionResource>(
        data.links.next,
        (txns, page) => upsertTransactions(txns, page, metrics, PROCESS_NAME),
        CURRENT_PAGE + 1
      );
    }
  }
};

export const handler = async () => {
  const metrics: ProcessTransactionsMetrics = {
    pages: { processed: 0, timings: [] },
    transactions: { total: 0, processed: 0, skipped: 0 },
    errors: {
      missingAccounts: new Set<string>(),
      missingCategories: new Set<string>(),
    },
    startTime: Date.now(),
  };

  try {
    // Sync all accounts, categories and tags
    await processAccounts();
    await processCategories();
    await processTags();

    const now = new Date();
    const currentMonth = startOfMonth(now);

    // Sync current month
    await syncTransactionsForMonth(
      currentMonth.toISOString(),
      addMonths(currentMonth, 1).toISOString(),
      metrics
    );

    // Retrieve last synced month
    const cursorMonth = await getMonthToSync(currentMonth);
    if (!cursorMonth) {
      return;
    }

    // Sync cursor month
    await syncTransactionsForMonth(
      cursorMonth.toISOString(),
      addMonths(cursorMonth, 1).toISOString(),
      metrics
    );

    // Write month synced and wrap if needed
    await writeCursor(cursorMonth);

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
      months: {
        current: currentMonth.toISOString(),
        cursor: cursorMonth.toISOString(),
      },
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
        pages: metrics.pages.processed,
        transactions: metrics.transactions,
        missingAccounts: Array.from(metrics.errors.missingAccounts),
        missingCategories: Array.from(metrics.errors.missingCategories),
      },
    });

    await notify(
      ALERT_LEVEL.ERROR,
      `${PROCESS_NAME} failed: ${error instanceof Error ? error.message : error}`
    );
  }
};
