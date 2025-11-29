import { transactionTable, transactionTagTable } from 'afinia-common/schema';
import { and, eq } from 'drizzle-orm';
import { db } from '../client';

export const getTransactionsByTag = (tag: string) =>
  db
    .select({
      id: transactionTable.transaction_id,
      providerId: transactionTable.provider_id,
    })
    .from(transactionTable)
    .innerJoin(
      transactionTagTable,
      eq(transactionTable.transaction_id, transactionTagTable.transaction_id)
    )
    .where(eq(transactionTagTable.tag_id, tag));

/**
 * Retrieve a transaction by provider ID
 * @param id Provider ID, e.g. a UUID for Up
 * @returns
 */
export const getTransactionByProviderId = (id: string) =>
  db
    .select({ id: transactionTable.transaction_id })
    .from(transactionTable)
    .where(eq(transactionTable.provider_id, id));

/**
 * Tag a transaction
 * @param id Database transaction id
 * @param tag Tag
 * @returns
 */
export const updateTransactionTag = (id: number, tag: string) =>
  db.insert(transactionTagTable).values({
    transaction_id: id,
    tag_id: tag,
  });

/**
 * Delete a tagged transaction
 * @param id Database transaction id
 * @param tag Tag
 * @returns
 */
export const deleteTransactionTag = (id: number, tag: string) =>
  db
    .delete(transactionTagTable)
    .where(
      and(
        eq(transactionTagTable.transaction_id, id),
        eq(transactionTagTable.tag_id, tag)
      )
    );
