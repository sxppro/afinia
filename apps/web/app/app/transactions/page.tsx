import SearchInput from '@/components/misc/search-input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import TransactionList from '@/components/vis/transaction/transaction-list';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { siteConfig } from '@/lib/siteConfig';
import { ArrowLeft, Ellipsis } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

const TransactionsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) => {
  const { query } = await searchParams;

  return (
    <div className="flex flex-col gap-4">
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
              filters: { search_term: query },
              limit: query ? undefined : DEFAULT_PAGE_SIZE,
            }}
            isInfinite
          />
        </Suspense>
      </div>
    </div>
  );
};

export default TransactionsPage;
