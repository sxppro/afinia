export const transactionSortValues = [
  'date-desc',
  'date-asc',
  'amount-desc',
  'amount-asc',
] as const;

export type TransactionSort = (typeof transactionSortValues)[number];

export const DEFAULT_TRANSACTION_SORT: TransactionSort = 'date-desc';

/**
 * Checks if input is a valid transaction sort
 * @param value
 * @returns
 */
export const isValidSort = (value?: string): value is TransactionSort =>
  transactionSortValues.some((sort) => sort === value);
