import TransactionsList from '@/components/dashboards/transactions-list';
import QuickActions from '@/components/quick-actions';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { getAccountBalance } from '@/lib/db/account';
import { siteConfig } from '@/lib/siteConfig';
import { formatValueInBaseUnits } from '@/lib/ui';
import NumberFlow from '@number-flow/react';
import { transactionExternalTable } from 'afinia-common/schema';
import { desc } from 'drizzle-orm';
import { Bell, ChevronRight, Menu, Search } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { db } from '../../lib/db/client';

const AppHome = async () => {
  const TRANSACTIONS_PER_PAGE = 6;
  const balance = await getAccountBalance();
  const transactions = db
    .select()
    .from(transactionExternalTable)
    .limit(TRANSACTIONS_PER_PAGE)
    .orderBy(desc(transactionExternalTable.created_at));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <Button className="rounded-full" variant="outline" size="icon-xl">
          <Menu className="size-5" />
        </Button>
        <div className="flex gap-2">
          <Button className="rounded-full" variant="outline" size="icon-xl">
            <Bell className="size-5" />
          </Button>
          <Button className="rounded-full" variant="outline" size="icon-xl">
            <Search className="size-5" />
          </Button>
        </div>
      </div>

      <div>
        <p className="text-muted-foreground text-lg font-medium">Balance</p>
        <NumberFlow
          className="text-4xl/tight font-semibold"
          value={formatValueInBaseUnits(balance[0]?.value)}
          format={{
            style: 'currency',
            currency: 'AUD',
            currencyDisplay: 'narrowSymbol',
          }}
        />
      </div>
      <Separator />
      <QuickActions />
      <div className="flex flex-col gap-2">
        <Button
          variant="link"
          className="justify-start has-[>svg]:px-0 gap-0"
          asChild
        >
          <Link href={siteConfig.baseLinks.transactions}>
            <h2 className="text-xl font-semibold">Transactions</h2>
            <ChevronRight className="size-6" />
          </Link>
        </Button>
        <Suspense
          fallback={
            <>
              {[...Array(TRANSACTIONS_PER_PAGE)].map((_, i) => (
                <Skeleton className="h-12 w-full" key={i} />
              ))}
            </>
          }
        >
          <TransactionsList dataFetch={transactions} />
        </Suspense>
      </div>
    </div>
  );
};

export default AppHome;
