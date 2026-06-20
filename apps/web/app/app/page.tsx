import OptionsDropdown from '@/components/misc/options-dropdown';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import TransactionList from '@/components/vis/transaction/transaction-list';
import { getServerSession } from '@/lib/auth/session';
import { SMALL_PAGE_SIZE } from '@/lib/constants';
import { now } from '@/lib/dateTime';
import { siteConfig } from '@/lib/siteConfig';
import { getGreeting, getInitials } from '@/lib/ui';
import { format } from 'date-fns';
import { ChevronRight, Search } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import AccountBalanceTotal from './_components/account-balance-total';
import QuickActions, { QuickActionsLoading } from './_components/quick-actions';

const AppHome = async () => {
  const session = await getServerSession();

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
        <Suspense fallback={<Skeleton className="h-14 w-full" />}>
          <AccountBalanceTotal />
        </Suspense>
      </div>
      <Separator />
      <div className="flex flex-col gap-2">
        <div className="flex items-center">
          <Button
            variant="link"
            className="flex-1 justify-start gap-0 has-[>svg]:px-0"
            nativeButton={false}
            render={
              <Link href={siteConfig.baseLinks.spending}>
                <h2 className="text-xl font-semibold">Spending</h2>
                <ChevronRight className="size-6" />
              </Link>
            }
          />
          <p className="text-muted-foreground">{format(now(), 'MMMM yyyy')}</p>
        </div>
        <Suspense fallback={<QuickActionsLoading />}>
          <QuickActions />
        </Suspense>
      </div>
      <div className="flex flex-col gap-2">
        <Button
          variant="link"
          className="justify-start gap-0 has-[>svg]:px-0"
          nativeButton={false}
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
