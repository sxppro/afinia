import AccountTypeIcon from '@/components/icons/account-type-icon';
import DateRangePicker from '@/components/misc/date-range-picker';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import AccountBalanceByDay from '@/components/vis/account/account-balance-by-day';
import AccountBalanceTrend from '@/components/vis/account/account-balance-trend';
import { getDateRange } from '@/lib/dateTime';
import { getAccount, getAccountBalanceByDay } from '@/lib/db/account';
import { capitalise } from '@/lib/string';
import {
  format,
  formatDistanceStrict,
  formatDistanceToNowStrict,
} from 'date-fns';
import { InfoIcon } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import AccountBalance from './_components/account-balance';
import AccountTransactions from './_components/account-transactions';
import AccountPageHeader from './_components/page-header';

const AccountPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ accountId: string }>;
  searchParams: Promise<{ range?: string }>;
}) => {
  const { accountId } = await params;
  const [account] = await getAccount(Number(accountId));

  if (!account) {
    notFound();
  }

  const { range = '1m' } = await searchParams;
  const dateRange = getDateRange(range, account.created_at);
  const accountBalanceFetch = getAccountBalanceByDay({
    accountId: account.account_id,
    range: dateRange,
  });

  return (
    <div className="flex flex-col gap-4">
      <AccountPageHeader accountName={account.display_name} />
      <div className="flex items-center gap-4">
        <span className="flex aspect-square size-16 items-center justify-center rounded-2xl bg-fuchsia-400 text-white">
          <AccountTypeIcon type={account.type} className="size-8" />
        </span>
        <div className="flex-1">
          <h2 className="text-muted-foreground font-medium">Balance</h2>
          <Suspense fallback={<Skeleton className="h-9 w-32" />}>
            <AccountBalance accountId={account.account_id} />
          </Suspense>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <Suspense fallback={<Skeleton className="h-6 w-full" />}>
          <AccountBalanceTrend
            dataFetch={accountBalanceFetch}
            label={formatDistanceStrict(dateRange.start, dateRange.end)}
          />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-48 w-full" />}>
          <AccountBalanceByDay dataFetch={accountBalanceFetch} />
        </Suspense>
        <DateRangePicker lowerBound={account.created_at} />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <p className="text-muted-foreground">Account created</p>
          <Popover>
            <PopoverTrigger
              render={
                <div className="flex items-center gap-2">
                  <p className="text-end">
                    {formatDistanceToNowStrict(account.created_at)} ago
                  </p>
                  <InfoIcon className="size-4" />
                </div>
              }
            />
            <PopoverContent className="w-auto p-2 font-sans" align="end">
              {format(account.created_at, "do MMM yyyy 'at' h:mm aaa")}
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex justify-between">
          <p className="text-muted-foreground">Ownership type</p>
          <p className="text-end">{capitalise(account.ownership_type)}</p>
        </div>
      </div>
      <Separator />
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Transactions</h2>
        <div className="flex flex-col gap-2">
          <AccountTransactions accountId={account.account_id} />
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
