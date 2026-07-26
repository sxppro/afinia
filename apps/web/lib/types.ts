import type { getTransactionsPaginated } from './actions/transaction';

/**
 * For nicer hover types
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

/**
 * Extracts a single type from an array type
 */
export type Unpacked<T> = T extends (infer U)[] ? U : T;

export type DateRange = {
  from: Date;
  to: Date;
};

/**
 * Represents a single transaction from
 * `getTransactionsPaginated`
 */
export type TransactionRow = Awaited<
  ReturnType<typeof getTransactionsPaginated>
>['transactions'][number];

export type SearchParam = string | string[] | undefined;
