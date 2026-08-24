import SearchInput from '@/components/misc/search-input';
import { Skeleton } from '@/components/ui/skeleton';
import TransactionList from '@/components/vis/transaction/transaction-list';
import TransactionListFilters from '@/components/vis/transaction/transaction-list-filters';
import { TransactionFilters } from '@/lib/actions/transaction';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { getParentCategories } from '@/lib/db/category';
import { getTags } from '@/lib/db/tag';
import { getTransactionTypes } from '@/lib/db/transaction';
import { booleanParam, dateParam, stringParam } from '@/lib/params';
import { DEFAULT_TRANSACTION_SORT, isValidSort } from '@/lib/transaction-sort';
import type { SearchParam } from '@/lib/types';
import { Suspense } from 'react';
import TransactionsPageHeader from './_components/page-header';

const TransactionsPage = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, SearchParam>>;
}) => {
  const {
    category,
    query,
    from,
    to,
    tag,
    type,
    has_note,
    has_attachment,
    sort,
  } = await searchParams;

  const categoryId = stringParam(category);
  const fromDate = dateParam(from);
  const toDate = dateParam(to);
  const hasValidDateRange = !fromDate || !toDate || fromDate <= toDate;

  // Sorting
  const inputSort = stringParam(sort);
  const transactionSort = isValidSort(inputSort)
    ? inputSort
    : DEFAULT_TRANSACTION_SORT;

  // Filtering
  const filters = {
    category_id: categoryId === 'all' ? undefined : categoryId,
    search_term: stringParam(query),
    from: hasValidDateRange ? fromDate : undefined,
    to: hasValidDateRange ? toDate : undefined,
    tag_id: stringParam(tag),
    type: stringParam(type),
    has_note: booleanParam(has_note) === true ? true : undefined,
    has_attachment: booleanParam(has_attachment) === true ? true : undefined,
  } satisfies TransactionFilters;
  const hasFilters = Object.values(filters).some(
    (value) => value !== undefined
  );

  const categoriesFetch = getParentCategories();
  const tagsFetch = getTags();
  const txnTypesFetch = getTransactionTypes();

  return (
    <div className="flex flex-col gap-2">
      <TransactionsPageHeader />

      <div className="flex flex-col gap-2">
        <SearchInput placeholder="Search transactions ..." />
        <Suspense fallback={<Skeleton className="h-9 w-full" />}>
          <TransactionListFilters
            categoriesFetch={categoriesFetch}
            tagsFetch={tagsFetch}
            transactionTypesFetch={txnTypesFetch}
          />
        </Suspense>
        <Suspense
          fallback={
            <>
              {[...Array(DEFAULT_PAGE_SIZE)].map((_, i) => (
                <Skeleton className="h-12 w-full" key={i} />
              ))}
            </>
          }
        >
          <TransactionList
            options={{
              limit: DEFAULT_PAGE_SIZE,
              ...(hasFilters && {
                filters,
              }),
              sort:
                transactionSort === DEFAULT_TRANSACTION_SORT
                  ? undefined
                  : transactionSort,
            }}
            isInfinite
          />
        </Suspense>
      </div>
    </div>
  );
};

export default TransactionsPage;
