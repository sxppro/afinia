'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { getTransactionsPaginated } from '@/lib/actions/transaction';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { transactionExternalTable } from 'afinia-common/schema';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { useInView } from 'react-intersection-observer';
import TransactionItem from './transaction-item';

type TransactionListInfiniteProps = {
  initialTransactions: (typeof transactionExternalTable.$inferSelect)[];
};

const TransactionListInfinite = ({
  initialTransactions,
}: TransactionListInfiniteProps) => {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [isLoading, startTransition] = useTransition();
  const { ref, inView } = useInView({ rootMargin: '64px' });

  const loadMore = useCallback(async () => {
    if (!transactions || !transactions.at(-1) || isLoading) return;

    startTransition(async () => {
      const { transactions: newTransactions } = await getTransactionsPaginated({
        cursor: {
          created_at: transactions.at(-1)!.created_at,
          transaction_id: transactions.at(-1)!.transaction_id,
        },
      });
      setTransactions((prev) => [...prev, ...newTransactions]);
    });
  }, [transactions, isLoading]);

  useEffect(() => {
    if (inView) {
      loadMore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  return (
    <>
      {transactions.map((transaction) => (
        <TransactionItem
          key={transaction.transaction_id}
          transaction={transaction}
        />
      ))}
      {isLoading && (
        <>
          {[...Array(DEFAULT_PAGE_SIZE)].map((_, i) => (
            <Skeleton className="h-12 w-full" key={i} />
          ))}
        </>
      )}
      <div ref={ref} className="h-4" aria-hidden="true" />
    </>
  );
};

export default TransactionListInfinite;
