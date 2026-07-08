import DateRangePicker from '@/components/misc/date-range-picker';
import { Skeleton } from '@/components/ui/skeleton';
import AccountBalanceByDay from '@/components/vis/account/account-balance-by-day';
import { getDateRange } from '@/lib/dateTime';
import {
  getAccountBalanceByDay,
  getEarliestAccountCreatedAt,
} from '@/lib/db/account';
import { Suspense } from 'react';

const AccountBalanceTimeline = async ({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) => {
  // Determine when account was created for lower bound
  const [{ range = '1m' }, { date: earliestAccountCreatedAt }] =
    await Promise.all([searchParams, getEarliestAccountCreatedAt()]);

  if (!earliestAccountCreatedAt) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground w-full rounded border border-dashed p-4 text-center text-sm">
          No accounts found
        </p>
      </div>
    );
  }

  const dateRange = getDateRange(range, earliestAccountCreatedAt);
  const totalBalanceFetch = getAccountBalanceByDay({ range: dateRange });

  return (
    <div className="flex flex-col items-center gap-1">
      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <AccountBalanceByDay dataFetch={totalBalanceFetch} />
      </Suspense>
      <DateRangePicker lowerBound={earliestAccountCreatedAt} />
    </div>
  );
};

export default AccountBalanceTimeline;
