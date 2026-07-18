import { db } from '@/src/db/client';
import { TransactionResource } from 'afinia-common/providers/up';
import {
  accountTable,
  categoryTable,
  tagTable,
  transactionCashbackTable,
  transactionHoldInfoTable,
  transactionRoundUpTable,
  transactionTable,
  transactionTagTable,
} from 'afinia-common/schema';
import { and, eq, InferInsertModel, notInArray } from 'drizzle-orm';
import { ALERT_LEVEL } from '../utils/constants';
import { notify } from '../utils/notify';
import { buildConflictUpdateColumns } from '../utils/upsert';

export interface ProcessTransactionsMetrics {
  pages: {
    processed: number;
    timings: number[];
  };
  transactions: {
    total: number;
    processed: number;
    skipped: number;
  };
  errors: {
    missingAccounts: Set<string>;
    missingCategories: Set<string>;
    missingTags: Set<string>;
  };
  startTime: number;
  endTime?: number;
}

/**
 * Checks if metrics contains missing data errors
 * @param metrics
 * @returns
 */
export const hasMissingData = (metrics: ProcessTransactionsMetrics) =>
  metrics.errors.missingAccounts.size > 0 ||
  metrics.errors.missingCategories.size > 0 ||
  metrics.errors.missingTags.size > 0;

/**
 * Generates empty metrics object
 * @returns
 */
export const emptyMetrics = (): ProcessTransactionsMetrics => ({
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
    missingTags: new Set<string>(),
  },
  startTime: Date.now(),
});

/**
 * Upsert transactions into database
 * @param transactions - Transactions to upsert from Up
 * @param page - Page number
 * @param metrics - Metrics
 * @param processName - Process name
 * @returns
 */
export const upsertTransactions = async (
  transactions: TransactionResource[],
  page: number,
  metrics: ProcessTransactionsMetrics,
  processName: string
) => {
  const pageStartTime = Date.now();
  /**
   * Creating foreign key maps
   * ! With this approach, it is possible for
   * new accounts or categories that are referenced
   * in transactions from Up API to be missing if they
   * were created since the time accounts or categories
   * were last synced.
   */
  const [accounts, categories, tags] = await Promise.all([
    db.select().from(accountTable),
    db.select().from(categoryTable),
    db.select().from(tagTable),
  ]);
  const accountMap = new Map(
    accounts.map((account) => [account.provider_id, account.account_id])
  );
  const categoryMap = new Map(
    categories.map((category) => [category.category_id, category.category_id])
  );
  const tagsMap = new Set(tags.map((tag) => tag.tag_id));
  const transactionMap = new Map(transactions.map((tx) => [tx.id, tx]));

  const remap = (
    transaction: TransactionResource
  ): InferInsertModel<typeof transactionTable> | null => {
    const { attributes, id, relationships } = transaction;
    const {
      amount,
      cardPurchaseMethod,
      createdAt,
      deepLinkURL,
      description,
      foreignAmount,
      isCategorizable,
      message,
      note,
      performingCustomer,
      rawText,
      settledAt,
      status,
      transactionType,
    } = attributes;
    const { account, attachment, category, transferAccount } = relationships;

    // Check accounts exist
    const accountId = accountMap.get(account.data.id);
    let transferAccountId: number | null | undefined = null;
    let categoryId: string | null | undefined = null;

    if (!accountId) {
      console.error(
        `Failed to process transaction ${id} (page ${page}): missing account ${account.data.id}`
      );
      metrics.errors.missingAccounts.add(account.data.id);
      return null;
    }
    if (transferAccount?.data?.id) {
      transferAccountId = accountMap.get(transferAccount.data.id);
      if (!transferAccountId) {
        console.error(
          `Processing transaction ${id} (page ${page}): missing transfer account ${transferAccount.data.id}`
        );
        metrics.errors.missingAccounts.add(transferAccount.data.id);
        return null;
      }
    }
    if (category.data?.id) {
      categoryId = categoryMap.get(category.data.id);
      if (!categoryId) {
        console.warn(
          `Processing transaction ${id} (page ${page}): missing category ${category.data.id}`
        );
        metrics.errors.missingCategories.add(category.data.id);
      }
    }

    return {
      provider_id: id,
      type: transactionType,
      status,
      attachment_id: attachment.data?.id || null,
      raw_text: rawText,
      description,
      message,
      note: note?.text || null,
      card_purchase_method: cardPurchaseMethod?.method || null,
      card_number_suffix: cardPurchaseMethod?.cardNumberSuffix || null,
      customer_display_name: performingCustomer?.displayName || null,
      deep_link_url: deepLinkURL || null,
      is_categorizable: isCategorizable,
      currency_code: amount.currencyCode,
      value: amount.value,
      value_in_base_units: amount.valueInBaseUnits,
      foreign_currency_code: foreignAmount?.currencyCode || null,
      foreign_value: foreignAmount?.value || null,
      foreign_value_in_base_units: foreignAmount?.valueInBaseUnits || null,
      created_at: new Date(createdAt),
      settled_at: settledAt ? new Date(settledAt) : null,
      updated_at: new Date(),
      updated_by: processName,
      /**
       * Foreign keys
       */
      account_id: accountId,
      transfer_account_id: transferAccountId,
      category_id: categoryId,
    };
  };

  /**
   * Metrics
   */
  console.log(`Processing transactions: page ${page}`);
  const transformedTx = transactions
    .map(remap)
    .filter((transaction) => !!transaction);
  const skippedTx = transactions.length - transformedTx.length;
  metrics.transactions.total += transactions.length;
  metrics.transactions.skipped += skippedTx;

  if (transformedTx.length === 0) {
    console.warn(`No valid transactions: page ${page}`);
    const elapsedTime = Date.now() - pageStartTime;
    metrics.pages.timings.push(elapsedTime);
    metrics.pages.processed++;
    return;
  }

  try {
    await db.transaction(async (tx) => {
      /**
       * Insert transactions
       */
      const insertedTx = await tx
        .insert(transactionTable)
        .values(transformedTx)
        .onConflictDoUpdate({
          target: transactionTable.provider_id,
          set: {
            ...buildConflictUpdateColumns(transactionTable, [
              'type',
              'status',
              'attachment_id',
              'raw_text',
              'description',
              'message',
              'note',
              'card_purchase_method',
              'card_number_suffix',
              'customer_display_name',
              'deep_link_url',
              'is_categorizable',
              'currency_code',
              'value',
              'value_in_base_units',
              'foreign_currency_code',
              'foreign_value',
              'foreign_value_in_base_units',
              'settled_at',
              'category_id',
            ]),
            updated_at: new Date(),
            updated_by: processName,
          },
        })
        .returning({
          id: transactionTable.transaction_id,
          provider_id: transactionTable.provider_id,
        });

      /**
       * Related transaction records to insert/update at the same time
       */
      const txTag: InferInsertModel<typeof transactionTagTable>[] = [];
      const txHoldInfo: InferInsertModel<typeof transactionHoldInfoTable>[] =
        [];
      const txRoundUp: InferInsertModel<typeof transactionRoundUpTable>[] = [];
      const txCashback: InferInsertModel<typeof transactionCashbackTable>[] =
        [];

      for (const { id, provider_id } of insertedTx) {
        const transaction = transactionMap.get(provider_id);
        if (transaction) {
          const { attributes, relationships } = transaction;
          /**
           * Tags
           */
          const providerTagIds =
            relationships.tags.data?.map(({ id: tagId }) => tagId) ?? [];
          // Check if we have each tag in the database
          for (const tagId of providerTagIds) {
            if (tagsMap.has(tagId)) {
              txTag.push({
                transaction_id: id,
                tag_id: tagId,
              });
            } else {
              metrics.errors.missingTags.add(tagId);
            }
          }
          // Update linked tags for the transaction
          if (providerTagIds.length > 0) {
            await tx
              .delete(transactionTagTable)
              .where(
                and(
                  eq(transactionTagTable.transaction_id, id),
                  notInArray(transactionTagTable.tag_id, providerTagIds)
                )
              );
          } else {
            await tx
              .delete(transactionTagTable)
              .where(eq(transactionTagTable.transaction_id, id));
          }
          /**
           * Hold info
           */
          if (attributes.holdInfo) {
            const { holdInfo } = attributes;
            txHoldInfo.push({
              transaction_id: id,
              currency_code: holdInfo.amount.currencyCode,
              value: holdInfo.amount.value,
              value_in_base_units: holdInfo.amount.valueInBaseUnits,
              foreign_currency_code: holdInfo.foreignAmount?.currencyCode,
              foreign_value: holdInfo.foreignAmount?.value,
              foreign_value_in_base_units:
                holdInfo.foreignAmount?.valueInBaseUnits,
            });
          }
          /**
           * Round up
           */
          if (attributes.roundUp) {
            const { roundUp } = attributes;
            txRoundUp.push({
              transaction_id: id,
              currency_code: roundUp.amount.currencyCode,
              value: roundUp.amount.value,
              value_in_base_units: roundUp.amount.valueInBaseUnits,
              boost_currency_code: roundUp.boostPortion?.currencyCode,
              boost_value: roundUp.boostPortion?.value,
              boost_value_in_base_units: roundUp.boostPortion?.valueInBaseUnits,
            });
          }
          /**
           * Cashback
           */
          if (attributes.cashback) {
            const { cashback } = attributes;
            txCashback.push({
              transaction_id: id,
              description: cashback.description,
              currency_code: cashback.amount.currencyCode,
              value: cashback.amount.value,
              value_in_base_units: cashback.amount.valueInBaseUnits,
            });
          }
        } else {
          tx.rollback();
          await notify(
            ALERT_LEVEL.ERROR,
            `Inserted transaction not found during upsert: ${provider_id}`
          );
        }
      }

      if (txTag.length > 0) {
        await tx
          .insert(transactionTagTable)
          .values(txTag)
          .onConflictDoNothing();
      }
      if (txHoldInfo.length > 0) {
        await tx
          .insert(transactionHoldInfoTable)
          .values(txHoldInfo)
          .onConflictDoUpdate({
            target: transactionHoldInfoTable.transaction_id,
            set: buildConflictUpdateColumns(transactionHoldInfoTable, [
              'currency_code',
              'value',
              'value_in_base_units',
              'foreign_currency_code',
              'foreign_value',
              'foreign_value_in_base_units',
            ]),
          });
      }
      if (txRoundUp.length > 0) {
        await tx
          .insert(transactionRoundUpTable)
          .values(txRoundUp)
          .onConflictDoUpdate({
            target: transactionRoundUpTable.transaction_id,
            set: buildConflictUpdateColumns(transactionRoundUpTable, [
              'currency_code',
              'value',
              'value_in_base_units',
              'boost_currency_code',
              'boost_value',
              'boost_value_in_base_units',
            ]),
          });
      }
      if (txCashback.length > 0) {
        await tx
          .insert(transactionCashbackTable)
          .values(txCashback)
          .onConflictDoUpdate({
            target: transactionCashbackTable.transaction_id,
            set: buildConflictUpdateColumns(transactionCashbackTable, [
              'description',
              'currency_code',
              'value',
              'value_in_base_units',
            ]),
          });
      }
      metrics.transactions.processed += insertedTx.length;
    });
  } catch (error) {
    console.error(`Error inserting transactions on page ${page}:`, {
      error: error instanceof Error ? error.message : error,
      transactionCount: transformedTx.length,
    });
    throw error;
  }

  const elapsedTime = Date.now() - pageStartTime;
  metrics.pages.timings.push(elapsedTime);
  metrics.pages.processed++;
  console.log(
    `Finished processing transactions: page ${page} (${transformedTx.length} processed, ${skippedTx} skipped, ${elapsedTime}ms)`
  );
};

/**
 * Delete transaction from database
 * @param transactionId - Transaction provider ID
 * @param processName - Process name
 * @returns
 */
export const deleteTransaction = async (
  transactionId: string,
  processName: string,
  deletedAt?: Date
) => {
  const now = new Date();
  const res = await db
    .update(transactionTable)
    .set({
      deleted_at: deletedAt || now,
      updated_at: now,
      updated_by: processName,
    })
    .where(eq(transactionTable.provider_id, transactionId))
    .returning();

  console.log(
    `Deleted ${res.length} transaction${res.length > 1 ? 's' : ''}: ${res.map((r) => r.provider_id).join(', ')}`
  );

  return res.length;
};
