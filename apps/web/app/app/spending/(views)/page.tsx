import { Skeleton } from '@/components/ui/skeleton';
import { getEarliestAccountCreatedAt } from '@/lib/db/account';
import { SearchParam } from '@/lib/types';
import { Suspense } from 'react';
import SpendingMonthToggle from '../_components/overview/spending-month-toggle';
import SpendingOverview from '../_components/overview/spending-overview';
import SpendingViewTransition from '../_components/spending-view-transition';
import { monthLoader, resolveSpendingMonth } from '../_lib/month';

type SearchParams = Promise<Record<string, SearchParam>>;

const SpendingOverviewMonth = async ({
  searchParams,
}: {
  searchParams: SearchParams;
}) => {
  const [{ month }, earliest] = await Promise.all([
    monthLoader(searchParams),
    getEarliestAccountCreatedAt(),
  ]);
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

const SpendingOverviewPage = ({
  searchParams,
}: {
  searchParams: SearchParams;
}) => (
  <SpendingViewTransition>
    <Suspense
      fallback={
        <>
          <Skeleton className="h-9 w-full rounded-xl" />
          <Skeleton className="h-96 w-full" />
        </>
      }
    >
      <SpendingOverviewMonth searchParams={searchParams} />
    </Suspense>
  </SpendingViewTransition>
);

export default SpendingOverviewPage;
