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
  const { transactions, hasMore } = await getTransactionsPaginated(options);

  if (transactions.length === 0) {
    return (
      <p className="text-muted-foreground w-full rounded border border-dashed p-4 text-center text-sm">
        No transactions
      </p>
    );
  }

  if (isInfinite) {
    return (
      <TransactionListInfinite
        key={JSON.stringify(options)}
        initialTransactions={transactions}
        initialCursor={{
          created_at: transactions.at(-1)!.created_at,
          transaction_id: transactions.at(-1)!.transaction_id,
          value_in_base_units: transactions.at(-1)!.value_in_base_units,
        }}
        initialHasMore={hasMore}
        options={options}
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
