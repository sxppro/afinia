import SearchInput from '@/components/misc/search-input';
import { Skeleton } from '@/components/ui/skeleton';
import TransactionList from '@/components/vis/transaction/transaction-list';
import TransactionListFilters from '@/components/vis/transaction/transaction-list-filters';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { getParentCategories } from '@/lib/db/category';
import { endOfDay, isValid, parseISO, startOfDay } from 'date-fns';
import { Suspense } from 'react';
import TransactionsPageHeader from './_components/page-header';

const TransactionsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; date?: string; query?: string }>;
}) => {
  const {
    category: inputCategory,
    date: inputDate,
    query: inputQuery,
  } = await searchParams;
  const categoriesFetch = getParentCategories();
  const category = inputCategory?.trim();
  const query = inputQuery?.trim();
  const date = inputDate ? parseISO(inputDate) : undefined;
  const validDate = date && isValid(date) ? date : undefined;
  const hasFilters = category || query || validDate;

  return (
    <div className="flex flex-col gap-2">
      <TransactionsPageHeader />

      <div className="flex flex-col gap-2">
        <SearchInput placeholder="Search transactions ..." />
        <Suspense fallback={<Skeleton className="h-9 w-full" />}>
          <TransactionListFilters categoriesFetch={categoriesFetch} />
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
                filters: {
                  ...(category && { category_id: category }),
                  ...(validDate && {
                    end_at: endOfDay(validDate),
                    start_at: startOfDay(validDate),
                  }),
                  ...(query && { search_term: query }),
                },
              }),
            }}
            isInfinite
          />
        </Suspense>
      </div>
    </div>
  );
};

export default TransactionsPage;
