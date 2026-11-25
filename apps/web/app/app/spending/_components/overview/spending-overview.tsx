import { Separator } from '@/components/ui/separator';
import { getStartOfDay } from '@/lib/dateTime';
import { isSameMonth, type Interval } from 'date-fns';
import { connection } from 'next/server';
import { Suspense } from 'react';
import CategoryBreakdown, {
  CategoryBreakdownSkeleton,
} from './category-breakdown';
import RecurringPayments, {
  RecurringPaymentsSkeleton,
} from './recurring-payments';
import SpendingTotal, { SpendingTotalSkeleton } from './spending-total';
import TopMerchants, { TopMerchantsSkeleton } from './top-merchants';

const SpendingOverview = async ({
  range,
  previousRange,
  monthLabel,
}: {
  range: Interval<Date, Date>;
  previousRange: Interval<Date, Date>;
  monthLabel: string;
}) => {
  // Data fetching is only done at request time
  await connection();
  const isCurrentMonth = isSameMonth(range.start, getStartOfDay());
  const comparisonLabel = isCurrentMonth
    ? 'vs same time previous month'
    : 'vs previous month';

  return (
    <div className="flex flex-col gap-4">
      <Suspense fallback={<SpendingTotalSkeleton />}>
        <SpendingTotal
          range={range}
          previousRange={previousRange}
          comparisonLabel={comparisonLabel}
        />
      </Suspense>
      <Separator />
      <Suspense fallback={<CategoryBreakdownSkeleton />}>
        <CategoryBreakdown
          range={range}
          previousRange={previousRange}
          comparisonLabel={comparisonLabel}
        />
      </Suspense>
      <Separator />
      <Suspense fallback={<TopMerchantsSkeleton />}>
        <TopMerchants range={range} monthLabel={monthLabel} />
      </Suspense>
      {isCurrentMonth ? (
        <>
          <Separator />
          <Suspense fallback={<RecurringPaymentsSkeleton />}>
            <RecurringPayments />
          </Suspense>
        </>
      ) : null}
    </div>
  );
};

export default SpendingOverview;
