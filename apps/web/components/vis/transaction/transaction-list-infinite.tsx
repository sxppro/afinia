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
  useRef,
  useState,
  useTransition,
} from 'react';
import { useInView } from 'react-intersection-observer';
import TransactionItem from './transaction-item';

type TransactionListInfiniteProps = {
  initialTransactions: (typeof transactionExternalTable.$inferSelect)[];
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
  const filterMode = 'filters' in options;
  const pageSize = options.limit ?? DEFAULT_PAGE_SIZE;
  // State
  const [transactions, setTransactions] = useState(initialTransactions);
  const [cursor, setCursor] = useState<TransactionCursor | null>(initialCursor);
  const [offset, setOffset] = useState(filterMode ? options.offset || 0 : 0);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isFetching, setIsFetching] = useState(false);

  // Refs
  const inFlightLoadRef = useRef(false);
  const cursorRef = useRef(cursor);
  const offsetRef = useRef(offset);
  const hasMoreRef = useRef(hasMore);

  // Hooks
  const [isLoading, startTransition] = useTransition();
  const { ref, inView } = useInView({ rootMargin: '96px' });

  const loadMore = useCallback(async () => {
    if (!hasMoreRef.current || inFlightLoadRef.current) return;

    inFlightLoadRef.current = true;
    setIsFetching(true);
    const nextOffset = offsetRef.current + pageSize;

    try {
      const {
        transactions: newTransactions,
        hasMore: nextHasMore,
        next: nextCursor,
      } = await getTransactionsPaginated(
        // Fetch by filters or cursor
        filterMode
          ? {
              ...options,
              offset: nextOffset,
            }
          : {
              cursor: cursorRef.current,
              limit: pageSize,
            }
      );
      if (filterMode) {
        offsetRef.current = nextOffset;
      }
      cursorRef.current = nextCursor;
      hasMoreRef.current = nextHasMore;
      // startTransition limitation after an async fn
      // @see https://react.dev/reference/react/useTransition#react-doesnt-treat-my-state-update-after-await-as-a-transition
      startTransition(() => {
        setTransactions((prev) => [...prev, ...newTransactions]);
        setCursor(nextCursor);
        setHasMore(nextHasMore);
        if (filterMode) {
          setOffset(nextOffset);
        }
      });

    } catch (error) {
      console.error('Error fetching paginated transactions: ', error);
    } finally {
      inFlightLoadRef.current = false;
      setIsFetching(false);
    }
  }, [filterMode, options, pageSize, startTransition]);

  // Effects
  useEffect(() => {
    if (inView) {
      loadMore();
    }
  }, [inView, loadMore]);
  useEffect(() => {
    cursorRef.current = cursor;
  }, [cursor]);
  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);
  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  return (
    <>
      {transactions.map((transaction, i) => (
        <Fragment key={transaction.transaction_id}>
          <TransactionItem transaction={transaction} />
          {/* Hide last separator */}
          {i < transactions.length - 1 && <Separator />}
        </Fragment>
      ))}
      {(isFetching || isLoading) && (
        <>
          {[...Array(pageSize)].map((_, i) => (
            <Skeleton className="h-12 w-full" key={i} />
          ))}
        </>
      )}
      {hasMore && <div ref={ref} className="h-4" aria-hidden="true" />}
    </>
  );
};

export default TransactionListInfinite;
