import { transactionTable } from 'afinia-common/schema';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';

/**
 * Kinds of change to a transaction that alter calculations and
 * analytics derived from it (e.g. spending totals and breakdowns)
 * - `created`: transaction did not exist before
 * - `amount_changed`: value differs, e.g. settled at a different
 *   amount to the initial hold
 * - `reclassified`: category, merchant, type or categorisability differs
 * - `deleted`: transaction was soft deleted
 */
export type TransactionChangeKind =
  | 'created'
  | 'amount_changed'
  | 'reclassified'
  | 'deleted';

export interface TransactionChange {
  providerId: string;
  kinds: TransactionChangeKind[];
}

/**
 * Columns compared to detect material changes. Any column that feeds
 * derived calculations should be listed here.
 */
export const MATERIAL_COLUMNS = [
  'value_in_base_units',
  'category_id',
  'description',
  'type',
  'is_categorizable',
  'deleted_at',
] as const satisfies (keyof InferSelectModel<typeof transactionTable>)[];

export type TransactionSnapshot = Pick<
  InferSelectModel<typeof transactionTable>,
  'provider_id' | (typeof MATERIAL_COLUMNS)[number]
>;

type IncomingTransaction = Pick<
  InferInsertModel<typeof transactionTable>,
  | 'provider_id'
  | 'value_in_base_units'
  | 'category_id'
  | 'description'
  | 'type'
  | 'is_categorizable'
>;

/**
 * Compares incoming transactions against their state before an upsert
 * @param existing - Snapshots of the transactions prior to the upsert
 * @param incoming - Transactions about to be (or just) upserted
 * @returns One entry per transaction that materially changed.
 * Unchanged transactions and transactions that are already deleted
 * (an upsert does not restore them) are omitted.
 */
export const detectTransactionChanges = (
  existing: TransactionSnapshot[],
  incoming: IncomingTransaction[]
): TransactionChange[] => {
  const existingMap = new Map(existing.map((tx) => [tx.provider_id, tx]));
  const changes: TransactionChange[] = [];

  for (const tx of incoming) {
    const prior = existingMap.get(tx.provider_id);

    if (!prior) {
      changes.push({ providerId: tx.provider_id, kinds: ['created'] });
      continue;
    }
    // Deleted transactions are excluded from calculations
    if (prior.deleted_at) {
      continue;
    }

    const kinds: TransactionChangeKind[] = [];
    if (prior.value_in_base_units !== tx.value_in_base_units) {
      kinds.push('amount_changed');
    }
    if (
      prior.category_id !== (tx.category_id ?? null) ||
      prior.description !== (tx.description ?? null) ||
      prior.type !== (tx.type ?? null) ||
      prior.is_categorizable !== tx.is_categorizable
    ) {
      kinds.push('reclassified');
    }

    if (kinds.length > 0) {
      changes.push({ providerId: tx.provider_id, kinds });
    }
  }

  return changes;
};

/**
 * Counts transactions by kind of change. A transaction with multiple
 * kinds of change is counted once per kind.
 */
export const summariseTransactionChanges = (changes: TransactionChange[]) => {
  const summary: Partial<Record<TransactionChangeKind, number>> = {};
  for (const { kinds } of changes) {
    for (const kind of kinds) {
      summary[kind] = (summary[kind] ?? 0) + 1;
    }
  }
  return summary;
};
