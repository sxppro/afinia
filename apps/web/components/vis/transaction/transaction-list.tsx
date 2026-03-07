import { Separator } from '@/components/ui/separator';
import { getTransactionsPaginated } from '@/lib/actions/transaction';
import { Fragment } from 'react';
import TransactionItem from './transaction-item';
import TransactionListInfinite from './transaction-list-infinite';

const TransactionList = async ({
  isInfinite,
  options,
}: {
  isInfinite?: boolean;
  options: Parameters<typeof getTransactionsPaginated>[0];
}) => {
  const { transactions } = await getTransactionsPaginated(options);

  if (transactions.length === 0) {
    return (
      <p className="w-full p-4 rounded border border-dashed text-center text-sm text-muted-foreground">
        No transactions
      </p>
    );
  }

  // Disable load on scroll for search results
  if (isInfinite && !options?.filters?.search_term) {
    return (
      <TransactionListInfinite
        initialTransactions={transactions}
        initialCursor={{
          created_at: transactions.at(-1)!.created_at,
          transaction_id: transactions.at(-1)!.transaction_id,
        }}
      />
    );
  }

  return (
    <>
      {transactions.map((transaction, i) => (
        <Fragment key={transaction.transaction_id}>
          <TransactionItem transaction={transaction} />
          {/* Hide last separator */}
          {i < transactions.length - 1 && <Separator />}
        </Fragment>
      ))}
    </>
  );
};

export default TransactionList;
