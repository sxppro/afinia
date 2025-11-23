import LatestTransactions from '@/components/latest-transactions';
import QuickActions from '@/components/quick-actions';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { formatValueInBaseUnits } from '@/lib/ui';
import NumberFlow from '@number-flow/react';
import { accountTable, transactionExternalTable } from 'afinia-ingest/schema';
import { desc, sum } from 'drizzle-orm';
import { Bell, Menu, Search } from 'lucide-react';
import { Suspense } from 'react';
import { db } from '../../lib/db/client';

const AppHome = async () => {
  const accounts = await db
    .select({ value: sum(accountTable.value_in_base_units).mapWith(Number) })
    .from(accountTable);
  const transactions = db
    .select()
    .from(transactionExternalTable)
    .limit(5)
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
          className="text-4xl/tight font-semibold first-letter:text-xl"
          value={formatValueInBaseUnits(accounts[0]?.value)}
          format={{
            style: 'currency',
            currency: 'AUD',
            currencyDisplay: 'narrowSymbol',
          }}
        />
      </div>
      <Separator />
      <QuickActions />
      <Suspense
        fallback={
          <div className="flex flex-col gap-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        }
      >
        <LatestTransactions transactionsFetch={transactions} />
      </Suspense>
    </div>
  );
};

export default AppHome;
