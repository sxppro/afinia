import { transactionExternalTable } from 'afinia-common/schema';
import TransactionItem from './transaction-item';
import TransactionListInfinite from './transaction-list-infinite';

const TransactionList = async ({
  dataFetch,
  isInfinite,
}: {
  dataFetch: Promise<(typeof transactionExternalTable.$inferSelect)[]>;
  isInfinite?: boolean;
}) => {
  const transactions = await dataFetch;

  if (transactions.length === 0) {
    return (
      <p className="w-full p-4 rounded border border-dashed text-center text-sm text-muted-foreground">
        No data
      </p>
    );
  }

  if (isInfinite) {
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
      {transactions.map((transaction) => (
        <TransactionItem
          key={transaction.transaction_id}
          transaction={transaction}
        />
      ))}
    </>
  );
};

export default TransactionList;
