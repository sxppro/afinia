'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getTransactionsPaginated,
  TransactionCursor,
} from '@/lib/actions/transaction';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { TransactionRow } from '@/lib/types';
import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react';
import { useInView } from 'react-intersection-observer';
import TransactionItem from './transaction-item';

type TransactionListInfiniteProps = {
  initialTransactions: TransactionRow[];
  initialCursor: TransactionCursor | null;
  initialHasMore: boolean;
  options: Parameters<typeof getTransactionsPaginated>[0];
};

const TransactionListInfinite = ({
  initialTransactions,
  initialCursor,
  initialHasMore,
  options,
}: TransactionListInfiniteProps) => {
  const pageSize = options.limit ?? DEFAULT_PAGE_SIZE;
  // State
  const [transactions, setTransactions] = useState(initialTransactions);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(false);

  // Refs
  const inFlightLoadRef = useRef(false);
  const cursorRef = useRef(initialCursor);
  const hasMoreRef = useRef(hasMore);

  // Hooks
  const [isLoading, startTransition] = useTransition();
  const { ref, inView } = useInView({ rootMargin: '96px' });

  const loadMore = useCallback(async () => {
    if (!hasMoreRef.current || inFlightLoadRef.current) return;

    inFlightLoadRef.current = true;
    setIsFetching(true);
    setError(false);

    try {
      const {
        transactions: newTransactions,
        hasMore: nextHasMore,
        next: nextCursor,
      } = await getTransactionsPaginated({
        ...options,
        cursor: cursorRef.current,
        limit: pageSize,
      });
      cursorRef.current = nextCursor;
      hasMoreRef.current = nextHasMore;
      // startTransition limitation after an async fn
      // @see https://react.dev/reference/react/useTransition#react-doesnt-treat-my-state-update-after-await-as-a-transition
      startTransition(() => {
        setTransactions((prev) => [...prev, ...newTransactions]);
        setHasMore(nextHasMore);
      });
    } catch (error) {
      console.error('Error fetching paginated transactions: ', error);
      setError(true);
    } finally {
      inFlightLoadRef.current = false;
      setIsFetching(false);
    }
  }, [options, pageSize, startTransition]);

  // Effects
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
      {isFetching || isLoading ? (
        // Skeleton
        <>
          {[...Array(pageSize)].map((_, i) => (
            <Skeleton className="h-12 w-full" key={i} />
          ))}
        </>
      ) : hasMore && error ? (
        // Retry if error
        <div className="flex flex-col items-center justify-center gap-2 rounded border border-dashed p-4">
          <p className="text-muted-foreground text-sm">
            Failed to load more transactions
          </p>
          <Button variant="outline" size="sm" onClick={loadMore}>
            Retry
          </Button>
        </div>
      ) : hasMore ? (
        // Load more
        <div ref={ref} className="h-4" aria-hidden="true" />
      ) : null}
    </>
  );
};

export default TransactionListInfinite;
