import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getEarliestAccountCreatedAt } from '@/lib/db/account';
import { siteConfig } from '@/lib/siteConfig';
import { SearchParam } from '@/lib/types';
import { ArrowLeft, Ellipsis } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import SpendingMonthToggle from './_components/overview/spending-month-toggle';
import SpendingOverview from './_components/overview/spending-overview';
import SpendingTrends from './_components/spending-trends';
import SpendingViewTabs from './_components/spending-view-tabs';
import { resolveSpendingMonth } from './_lib/month';
import { viewLoader } from './_lib/search-params';

const SpendingPage = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, SearchParam>>;
}) => {
  const params = await viewLoader(searchParams);
  const { view, month } = params;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between">
        <div className="flex items-center gap-4">
          <Button
            className="rounded-full"
            variant="outline"
            size="icon-xl"
            nativeButton={false}
            render={
              <Link href={siteConfig.baseLinks.appHome}>
                <ArrowLeft className="size-5" />
              </Link>
            }
          />
          <h1 className="text-2xl/tight font-bold">Spending</h1>
        </div>
        <div>
          <Button className="rounded-full" variant="outline" size="icon-xl">
            <Ellipsis className="size-5" />
          </Button>
        </div>
      </div>

      <SpendingViewTabs activeView={view} />

      {view === 'trends' ? (
        <Suspense fallback={<Skeleton className="h-72 w-full" />}>
          <SpendingTrends />
        </Suspense>
      ) : (
        <Suspense
          fallback={
            <>
              <Skeleton className="h-9 w-full rounded-xl" />
              <Skeleton className="h-96 w-full" />
            </>
          }
        >
          <SpendingOverviewMonth month={month} />
        </Suspense>
      )}
    </div>
  );
};

const SpendingOverviewMonth = async ({ month }: { month: string | null }) => {
  const earliest = await getEarliestAccountCreatedAt();
  const {
    months,
    currentMonth,
    selectedMonth,
    selectedMonthLabel,
    range,
    previousRange,
  } = resolveSpendingMonth(month, earliest?.date);

  return (
    <SpendingMonthToggle
      months={months}
      selected={selectedMonth}
      currentMonth={currentMonth}
    >
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <SpendingOverview
          range={range}
          previousRange={previousRange}
          monthLabel={selectedMonthLabel}
        />
      </Suspense>
    </SpendingMonthToggle>
  );
};

export default SpendingPage;
