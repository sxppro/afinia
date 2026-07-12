import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import TransactionList from '@/components/vis/transaction/transaction-list';
import { SMALL_PAGE_SIZE } from '@/lib/constants';
import { now } from '@/lib/dateTime';
import { siteConfig } from '@/lib/siteConfig';
import { format } from 'date-fns';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import AccountBalanceTimeline from './_components/account-balance-timeline';
import AccountBalanceTotal from './_components/account-balance-total';
import AccountsList from './_components/accounts-list';
import AppHomePageHeader from './_components/page-header';
import QuickActions, { QuickActionsLoading } from './_components/quick-actions';
import ToggleBalanceVisibility from './_components/toggle-balance-visibility';

const AppHome = ({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) => {
  return (
    <div className="flex flex-col gap-4">
      <AppHomePageHeader />
      <div className="flex flex-col gap-2">
        <div>
          <p className="text-muted-foreground text-lg font-medium">Balance</p>
          <div className="flex items-center justify-between gap-4">
            <Suspense fallback={<Skeleton className="h-14 w-full" />}>
              <AccountBalanceTotal />
            </Suspense>
            <ToggleBalanceVisibility />
          </div>
        </div>
        <Suspense fallback={<Skeleton className="h-56 w-full" />}>
          <AccountBalanceTimeline searchParams={searchParams} />
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
        <h2 className="text-xl font-semibold">Accounts</h2>
        <Suspense fallback={<Skeleton className="h-40 w-full" />}>
          <AccountsList />
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
