import { transactionExternalTable } from 'afinia-common/schema';
import TransactionItem from './transaction-item';

const TransactionList = async ({
  dataFetch,
}: {
  dataFetch: Promise<(typeof transactionExternalTable.$inferSelect)[]>;
}) => {
  const transactions = await dataFetch;

  if (transactions.length === 0) {
    return (
      <p className="w-full p-4 rounded border border-dashed text-center text-sm text-muted-foreground">
        No data
      </p>
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
