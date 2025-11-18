import LatestTransactions from '@/components/latest-transactions';
import QuickActions from '@/components/quick-actions';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatValueInBaseUnits } from '@/lib/ui';
import NumberFlow from '@number-flow/react';
import { accountTable } from 'afinia-ingest/schema';
import { sum } from 'drizzle-orm';
import { Bell, Menu, Search } from 'lucide-react';
import { db } from '../lib/db/client';

export default async function Home() {
  const accounts = await db
    .select({ value: sum(accountTable.value_in_base_units).mapWith(Number) })
    .from(accountTable);

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
      <LatestTransactions />
    </div>
  );
}
