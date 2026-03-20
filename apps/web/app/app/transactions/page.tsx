import SearchInput from '@/components/misc/search-input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import TransactionList from '@/components/vis/transaction/transaction-list';
import TransactionListFilters from '@/components/vis/transaction/transaction-list-filters';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { getParentCategories } from '@/lib/db/category';
import { siteConfig } from '@/lib/siteConfig';
import { ArrowLeft, Ellipsis } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

const TransactionsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; query?: string }>;
}) => {
  const { category: inputCategory, query: inputQuery } = await searchParams;
  const categoriesFetch = getParentCategories();
  const category = inputCategory?.trim();
  const query = inputQuery?.trim();
  const hasFilters = category || query;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between">
        <div className="flex items-center gap-4">
          <Button
            className="rounded-full"
            variant="outline"
            size="icon-xl"
            asChild
          >
            <Link href={siteConfig.baseLinks.appHome}>
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">Transactions</h1>
        </div>
        <div>
          <Button className="rounded-full" variant="outline" size="icon-xl">
            <Ellipsis className="size-5" />
          </Button>
        </div>
      </div>

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
