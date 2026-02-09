import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import TransactionList from '@/components/vis/transaction/transaction-list';
import { getTransactions } from '@/lib/db/transaction';
import { siteConfig } from '@/lib/siteConfig';
import { ArrowLeft, Ellipsis } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

const TransactionsPage = () => {
  const TRANSACTIONS_PER_PAGE = 25;
  const transactions = getTransactions(TRANSACTIONS_PER_PAGE);

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

      <Suspense
        fallback={
          <>
            {[...Array(TRANSACTIONS_PER_PAGE)].map((_, i) => (
              <Skeleton className="h-12 w-full" key={i} />
            ))}
          </>
        }
      >
        <TransactionList dataFetch={transactions} />
      </Suspense>
    </div>
  );
};

export default TransactionsPage;
