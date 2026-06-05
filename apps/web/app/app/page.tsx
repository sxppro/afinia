import CurrencyFlow from '@/components/currency-flow';
import OptionsDropdown from '@/components/misc/options-dropdown';
import QuickActions from '@/components/quick-actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import TransactionList from '@/components/vis/transaction/transaction-list';
import { getServerSession } from '@/lib/auth/session';
import { SMALL_PAGE_SIZE } from '@/lib/constants';
import { getAccountBalance } from '@/lib/db/account';
import { siteConfig } from '@/lib/siteConfig';
import { getGreeting, getInitials } from '@/lib/ui';
import { ChevronRight, Search } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

const AppHome = async () => {
  const [session, balance] = await Promise.all([
    getServerSession(),
    getAccountBalance(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="size-12 rounded-full">
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
          <OptionsDropdown />
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
          className="justify-start gap-0 has-[>svg]:px-0"
          render={
            <Link href={siteConfig.baseLinks.transactions}>
              <h2 className="text-xl font-semibold">Transactions</h2>
              <ChevronRight className="size-6" />
            </Link>
          }
        />
        <Suspense
          fallback={
            <>
              {[...Array(SMALL_PAGE_SIZE)].map((_, i) => (
                <Skeleton className="h-12 w-full" key={i} />
              ))}
            </>
          }
        >
          <TransactionList options={{ limit: SMALL_PAGE_SIZE }} />
        </Suspense>
      </div>
    </div>
  );
};

export default AppHome;
