import CurrencyFlow from '@/components/currency-flow';
import QuickActions from '@/components/quick-actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import TransactionsList from '@/components/vis/transactions-list';
import { getServerSession } from '@/lib/auth/session';
import { getAccountBalance } from '@/lib/db/account';
import { siteConfig } from '@/lib/siteConfig';
import { getGreeting, getInitials } from '@/lib/ui';
import { transactionExternalTable } from 'afinia-common/schema';
import { desc } from 'drizzle-orm';
import { ChevronRight, Ellipsis, Search } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { db } from '../../lib/db/client';

const AppHome = async () => {
  const TRANSACTIONS_PER_PAGE = 6;
  const session = await getServerSession();
  const balance = await getAccountBalance();
  const transactions = db
    .select()
    .from(transactionExternalTable)
    .limit(TRANSACTIONS_PER_PAGE)
    .orderBy(desc(transactionExternalTable.created_at));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Avatar className="rounded-full size-12">
            <AvatarImage
              src={session?.user?.image ?? undefined}
              alt={session?.user?.name}
            />
            <AvatarFallback>
              {getInitials(session?.user?.name) || 'HI'}
            </AvatarFallback>
          </Avatar>
          <p className="max-w-32 text-sm wrap-normal">
            {`${getGreeting()}, `}
            <span className="text-lg font-semibold">{session?.user?.name}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="rounded-full" variant="outline" size="icon-xl">
            <Search className="size-5" />
          </Button>
          <Button className="rounded-full" variant="outline" size="icon-xl">
            <Ellipsis className="size-5" />
          </Button>
        </div>
      </div>

      <div>
        <p className="text-muted-foreground text-lg font-medium">Balance</p>
        <CurrencyFlow
          className="text-4xl/tight font-semibold"
          value={balance[0]?.value}
          signDisplay="auto"
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
