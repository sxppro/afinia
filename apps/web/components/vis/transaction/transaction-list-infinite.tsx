'use client';

import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getTransactionsPaginated,
  TransactionCursor,
} from '@/lib/actions/transaction';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { transactionExternalTable } from 'afinia-common/schema';
import {
  Fragment,
  useCallback,
  useEffect,
  useState,
  useTransition,
} from 'react';
import { useInView } from 'react-intersection-observer';
import TransactionItem from './transaction-item';

type TransactionListInfiniteProps = {
  initialTransactions: (typeof transactionExternalTable.$inferSelect)[];
  initialCursor: TransactionCursor | null;
};

const TransactionListInfinite = ({
  initialTransactions,
  initialCursor,
}: TransactionListInfiniteProps) => {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [cursor, setCursor] = useState<TransactionCursor | null>(initialCursor);
  const [isLoading, startTransition] = useTransition();
  const { ref, inView } = useInView({ rootMargin: '96px' });

  const loadMore = useCallback(async () => {
    if (!cursor || isLoading) return;

    startTransition(async () => {
      const { transactions: newTransactions, next: nextCursor } =
        await getTransactionsPaginated({
          cursor,
        });
      // startTransition limitation after an async fn
      // @see https://react.dev/reference/react/useTransition#react-doesnt-treat-my-state-update-after-await-as-a-transition
      startTransition(() => {
        setTransactions((prev) => [...prev, ...newTransactions]);
        setCursor(nextCursor);
      });
    });
  }, [cursor, isLoading]);

  useEffect(() => {
    if (inView) {
      loadMore();
    }
  }, [inView, loadMore]);

  return (
    <>
      {transactions.map((transaction, i) => (
        <Fragment key={transaction.transaction_id}>
          <TransactionItem transaction={transaction} />
          {/* Hide last separator */}
          {i < transactions.length - 1 && <Separator />}
        </Fragment>
      ))}
      {isLoading && (
        <>
          {[...Array(DEFAULT_PAGE_SIZE)].map((_, i) => (
            <Skeleton className="h-12 w-full" key={i} />
          ))}
        </>
      )}
      {cursor && <div ref={ref} className="h-4" aria-hidden="true" />}
    </>
  );
};

export default TransactionListInfinite;
