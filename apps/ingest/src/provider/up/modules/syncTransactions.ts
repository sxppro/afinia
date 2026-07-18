import { db } from '@/src/db/client';
import { checkDatabaseConnection } from '@/src/db/connection';
import { getEarliestAccountCreatedAt } from '@/src/db/queries/account';
import { getTransactionsByDateRange } from '@/src/db/queries/transaction';
import { TransactionResource } from 'afinia-common/providers/up';
import {
  jobStateTable,
  transactionCashbackTable,
  transactionHoldInfoTable,
  transactionRoundUpTable,
  transactionTable,
} from 'afinia-common/schema';
import {
  addMonths,
  isAfter,
  isBefore,
  isEqual,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { eq } from 'drizzle-orm';
import pLimit from 'p-limit';
import {
  deleteTransaction,
  emptyMetrics,
  ProcessTransactionsMetrics,
  upsertTransactions,
} from '../common/transaction';
import { upClient } from '../utils/clients';
import {
  ALERT_LEVEL,
  DEFAULT_PAGE_SIZE,
  MAX_CONCURRENCY,
  RATE_LIMIT_HEADER,
} from '../utils/constants';
import { getNextPage, isRateLimitReached } from '../utils/fetch';
import { notify } from '../utils/notify';
import { processAccounts } from './processAccounts';
import { processCategories } from './processCategories';
import { processTags } from './processTags';

const PROCESS_NAME = 'syncTransactions';
const CURSOR_KEY = 'syncTransactions.cursor';
const MONTHS_TO_SYNC = 2;

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
      `[${PROCESS_NAME}] Account creation month reached: wrapping around to previous month`
    );
    return startOfMonth(subMonths(currentMonth, 1));
  } else {
    // Subtract a month from cursor
    return startOfMonth(subMonths(storedCursor, 1));
  }
};

/**
 * Sanity checking transaction attributes match
 * @param providerTxn - Provider transaction
 * @param txn - Transaction in database
 */
const checkTransactionAttributes = async (
  providerTxn: TransactionResource,
  txn: {
    transaction: typeof transactionTable.$inferSelect;
    transaction_hold_info: typeof transactionHoldInfoTable.$inferSelect | null;
    transaction_round_up: typeof transactionRoundUpTable.$inferSelect | null;
    transaction_cashback: typeof transactionCashbackTable.$inferSelect | null;
  }
) => {
  if (
    providerTxn.attributes.amount.valueInBaseUnits !==
    txn.transaction.value_in_base_units
  ) {
    await notify(
      ALERT_LEVEL.WARN,
      `Transaction ${txn.transaction.provider_id} has incorrect value in base units: expected ${providerTxn.attributes.amount.valueInBaseUnits}, received ${txn.transaction.value_in_base_units}`
    );
  }
  if (providerTxn.attributes.status !== txn.transaction.status) {
    await notify(
      ALERT_LEVEL.WARN,
      `Transaction ${txn.transaction.provider_id} has incorrect status: expected ${providerTxn.attributes.status}, received ${txn.transaction.status}`
    );
  }
  if (
    providerTxn.attributes.holdInfo?.amount.valueInBaseUnits !==
    txn.transaction_hold_info?.value_in_base_units
  ) {
    await notify(
      ALERT_LEVEL.WARN,
      `Transaction ${txn.transaction.provider_id} has incorrect hold info value in base units: expected ${providerTxn.attributes.holdInfo?.amount.valueInBaseUnits}, received ${txn.transaction_hold_info?.value_in_base_units}`
    );
  }
  if (
    providerTxn.attributes.roundUp?.amount.valueInBaseUnits !==
    txn.transaction_round_up?.value_in_base_units
  ) {
    await notify(
      ALERT_LEVEL.WARN,
      `Transaction ${txn.transaction.provider_id} has incorrect round up value in base units: expected ${providerTxn.attributes.roundUp?.amount.valueInBaseUnits}, received ${txn.transaction_round_up?.value_in_base_units}`
    );
  }
  if (
    providerTxn.attributes.cashback?.amount.valueInBaseUnits !==
    txn.transaction_cashback?.value_in_base_units
  ) {
    await notify(
      ALERT_LEVEL.WARN,
      `Transaction ${txn.transaction.provider_id} has incorrect cashback value in base units: expected ${providerTxn.attributes.cashback?.amount.valueInBaseUnits}, received ${txn.transaction_cashback?.value_in_base_units}`
    );
  }
};

/**
 * Sync transactions from Up between start and end dates
 * @returns whether the sync was completed in full
 */
const syncTransactionsByDateRange = async (
  start: Date,
  end: Date,
  metrics: ProcessTransactionsMetrics
): Promise<boolean> => {
  const startDate = start.toISOString();
  const endDate = end.toISOString();
  const providerTxns = new Map<string, TransactionResource>();
  const syncStartTime = new Date();
  const CURRENT_PAGE = 1;
  let paginationComplete = false;

  console.log(`[Up] Fetching transactions from ${startDate} to ${endDate}`);

  // Fetch transactions from Up API
  const { data, response, error } = await upClient.GET('/transactions', {
    params: {
      query: {
        'filter[since]': startDate,
        'filter[until]': endDate,
        'page[size]': DEFAULT_PAGE_SIZE,
      },
    },
  });

  if (error) {
    console.error(error);
    await notify(
      ALERT_LEVEL.ERROR,
      `[Up] Failed to fetch transactions for ${startDate} - ${endDate}: ${JSON.stringify(error)}`
    );
    return false;
  }
  if (!data) {
    return false;
  }

  // Process data
  paginationComplete = data.links?.next === null;
  if (data.data) {
    await upsertTransactions(data.data, CURRENT_PAGE, metrics, PROCESS_NAME);
    data.data.forEach((t) => providerTxns.set(t.id, t));
  }
  // Process subsequent pages if available
  if (data.links?.next) {
    if (isRateLimitReached(response.headers)) {
      console.warn(`[${PROCESS_NAME}] Rate limit reached after page 1`);
    } else {
      const result = await getNextPage<TransactionResource>(
        data.links.next,
        async (txns, page) => {
          await upsertTransactions(txns, page, metrics, PROCESS_NAME);
          txns.forEach((t) => providerTxns.set(t.id, t));
        },
        CURRENT_PAGE + 1
      );
      paginationComplete = result.complete;
    }
  }

  /**
   * Only audit transactions in database against provider if
   * all transactions were retrieved from provider
   */
  if (paginationComplete) {
    await checkTransactionsByDateRange(start, end, syncStartTime, providerTxns);
  } else {
    console.warn(
      `[${PROCESS_NAME}] Failed to retrieve all transactions between ${startDate}-${endDate}: transaction sync incomplete`
    );
  }

  return paginationComplete;
};

/**
 * Checks transactions in database against provider
 * between start and end dates
 * @param start
 * @param end
 * @param syncStartTime - Start time of sync
 * @param providerData - Map of provider transactions between start and end dates, if available
 * @returns
 */
const checkTransactionsByDateRange = async (
  start: Date,
  end: Date,
  syncStartTime: Date,
  providerData?: Map<string, TransactionResource>
) => {
  try {
    const transactions = await getTransactionsByDateRange(start, end)
      .leftJoin(
        transactionHoldInfoTable,
        eq(
          transactionHoldInfoTable.transaction_id,
          transactionTable.transaction_id
        )
      )
      .leftJoin(
        transactionRoundUpTable,
        eq(
          transactionRoundUpTable.transaction_id,
          transactionTable.transaction_id
        )
      )
      .leftJoin(
        transactionCashbackTable,
        eq(
          transactionCashbackTable.transaction_id,
          transactionTable.transaction_id
        )
      );

    if (transactions.length === 0) {
      console.log(
        `[DB Txns Check] No transactions found in database between ${start.toISOString()} and ${end.toISOString()}`
      );
      return;
    }

    // Compare with provider data if available
    if (providerData) {
      console.log(
        `[DB Txns Check] Comparing with provider data: ${providerData.size} transactions from provider, ${transactions.length} transactions in database`
      );
      if (providerData.size === 0 && transactions.length > 0) {
        await notify(
          ALERT_LEVEL.WARN,
          `[Up] No transaction data found between ${start.toISOString()} and ${end.toISOString()}`
        );
        return;
      }

      /**
       * Audit and deletes any transactions in database
       * that are not present in provider data
       */
      await Promise.all(
        transactions.map(async (txn) => {
          const providerTxn = providerData.get(txn.transaction.provider_id);
          if (providerTxn) {
            await checkTransactionAttributes(providerTxn, txn);
          } else {
            // Skip if transaction was modified by another process after sync started
            if (
              txn.transaction.updated_by !== PROCESS_NAME &&
              txn.transaction.updated_at &&
              isAfter(txn.transaction.updated_at, syncStartTime)
            ) {
              return;
            }
            await deleteTransaction(txn.transaction.provider_id, PROCESS_NAME);
            await notify(
              ALERT_LEVEL.WARN,
              `[DB Txns Check] Transaction ${txn.transaction.provider_id} deleted: not found in provider data between ${start.toISOString()} and ${end.toISOString()}`
            );
          }
        })
      );
    } else {
      // Ping Up API to check remaining requests
      const { response, error } = await upClient.GET('/util/ping');

      if (error) {
        console.error(error);
        await notify(ALERT_LEVEL.ERROR, `[Up] Failed to ping API`);
      }
      if (response.ok) {
        const rateLimitRemaining = response.headers.get(RATE_LIMIT_HEADER);
        if (
          rateLimitRemaining &&
          parseInt(rateLimitRemaining, 10) < transactions.length
        ) {
          await notify(
            ALERT_LEVEL.WARN,
            '[DB Txns Check] Skipping: Up rate limit exceeded'
          );
          return;
        }
      }

      console.log(
        `[DB Txns Check] Checking ${transactions.length} transactions in database, fetching provider data ...`
      );

      const limit = pLimit(MAX_CONCURRENCY);

      await Promise.all(
        transactions.map(async (txn) =>
          limit(async () => {
            const { data, response, error } = await upClient.GET(
              '/transactions/{id}',
              {
                params: {
                  path: {
                    id: txn.transaction.provider_id,
                  },
                },
              }
            );

            if (error) {
              console.error(error);
              await notify(
                ALERT_LEVEL.WARN,
                `[Up] Failed to fetch transaction (${txn.transaction.provider_id})`
              );
              return;
            }

            if (response.ok && data.data) {
              const providerTxn = data.data;
              await checkTransactionAttributes(providerTxn, txn);
            } else {
              if (response.status === 404) {
                // Skip if transaction was modified by another process after sync started
                if (
                  txn.transaction.updated_by !== PROCESS_NAME &&
                  txn.transaction.updated_at &&
                  isAfter(txn.transaction.updated_at, syncStartTime)
                ) {
                  return;
                }
                await deleteTransaction(
                  txn.transaction.provider_id,
                  PROCESS_NAME
                );
                await notify(
                  ALERT_LEVEL.WARN,
                  `[DB Txns Check] Transaction ${txn.transaction.provider_id} deleted: not found in provider data between ${start.toISOString()} and ${end.toISOString()}`
                );
              } else {
                await notify(
                  ALERT_LEVEL.WARN,
                  `[Up] Unknown response status fetching transaction (${txn.transaction.provider_id}): ${response.status} ${response.statusText}`
                );
              }
            }
          })
        )
      );
    }
  } catch (error) {
    console.error(error);
    await notify(
      ALERT_LEVEL.ERROR,
      `[DB Txns Check] Failed to check transactions from db`
    );
    return;
  }
};

export const handler = async () => {
  const metrics = emptyMetrics();

  try {
    // Check database connection
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      await notify(
        ALERT_LEVEL.ERROR,
        `[${PROCESS_NAME}] Failed to connect to database: skipping transaction sync`
      );
      return;
    }

    // Sync all accounts, categories and tags
    const accountsSynced = await processAccounts();
    const categoriesSynced = await processCategories();
    const tagsSynced = await processTags();

    if (
      ![accountsSynced, categoriesSynced, tagsSynced].every(
        (success) => success
      )
    ) {
      await notify(
        ALERT_LEVEL.WARN,
        `[${PROCESS_NAME}] Failed to sync all accounts, categories and tags: transaction sync may encounter errors`
      );
    }

    console.info(`[${PROCESS_NAME}] Sync Status: 
      Accounts: ${accountsSynced ? 'Success' : 'Incomplete'}
      Categories: ${categoriesSynced ? 'Success' : 'Incomplete'}
      Tags: ${tagsSynced ? 'Success' : 'Incomplete'}
    `);

    const now = new Date();
    const currentMonth = startOfMonth(now);

    // Sync current month
    const currentMonthComplete = await syncTransactionsByDateRange(
      currentMonth,
      addMonths(currentMonth, 1),
      metrics
    );
    if (!currentMonthComplete) {
      await notify(
        ALERT_LEVEL.WARN,
        `[${PROCESS_NAME}] Failed to sync current month: transaction sync incomplete`
      );
      return;
    }

    // Sync historical cursor months
    const syncedMonths: Date[] = [];
    for (let i = 0; i < MONTHS_TO_SYNC; i++) {
      const cursorMonth = await getMonthToSync(currentMonth);
      if (!cursorMonth) {
        break;
      }
      /**
       * Stop if we've reached a month that has just been synced
       */
      if (syncedMonths.some((m) => isEqual(m, cursorMonth))) {
        console.log(
          `[${PROCESS_NAME}] Cursor wrapped to month already synced - ${cursorMonth.toISOString()}: stopping transaction sync`
        );
        break;
      }

      const complete = await syncTransactionsByDateRange(
        cursorMonth,
        addMonths(cursorMonth, 1),
        metrics
      );
      /**
       * Stop if sync was incomplete
       */
      if (!complete) {
        await notify(
          ALERT_LEVEL.WARN,
          `[${PROCESS_NAME}] Failed to sync month of ${cursorMonth.toISOString()}: not advancing cursor`
        );
        break;
      }

      await writeCursor(cursorMonth);
      syncedMonths.push(cursorMonth);
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
      months: {
        current: currentMonth.toISOString(),
        cursors: syncedMonths.map((m) => m.toISOString()),
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

    await notify(
      ALERT_LEVEL.ERROR,
      `${PROCESS_NAME} failed: ${error instanceof Error ? error.message : error}`
    );
  }
};
