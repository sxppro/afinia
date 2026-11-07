import { Separator } from '@/components/ui/separator';
import { getStartOfDay } from '@/lib/dateTime';
import {
  addDays,
  endOfDay,
  endOfMonth,
  getDate,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { Suspense } from 'react';
import CategoryBreakdown, {
  CategoryBreakdownSkeleton,
} from './category-breakdown';
import RecurringPayments, {
  RecurringPaymentsSkeleton,
} from './recurring-payments';
import SpendingTotal, { SpendingTotalSkeleton } from './spending-total';
import TopMerchants, { TopMerchantsSkeleton } from './top-merchants';
import { connection } from 'next/server';

const SpendingOverview = async () => {
  // TODO: Cache Components adoption. Added to unblock the build: remove this boundary to re-trigger the error and review the documented options.
  await connection();
  const today = getStartOfDay();
  const currentStart = startOfMonth(today);
  const currentRange = { start: currentStart, end: endOfDay(today) };
  const previousStart = startOfMonth(subMonths(today, 1));
  const previousEnd = endOfDay(
    addDays(
      previousStart,
      Math.min(getDate(today) - 1, getDate(endOfMonth(previousStart)) - 1)
    )
  );
  const previousRange = { start: previousStart, end: previousEnd };

  return (
    <div className="flex flex-col gap-4">
      <Suspense fallback={<SpendingTotalSkeleton />}>
        <SpendingTotal range={currentRange} previousRange={previousRange} />
      </Suspense>
      <Separator />
      <Suspense fallback={<CategoryBreakdownSkeleton />}>
        <CategoryBreakdown range={currentRange} previousRange={previousRange} />
      </Suspense>
      <Separator />
      <Suspense fallback={<TopMerchantsSkeleton />}>
        <TopMerchants range={currentRange} />
      </Suspense>
      <Separator />
      <Suspense fallback={<RecurringPaymentsSkeleton />}>
        <RecurringPayments />
      </Suspense>
    </div>
  );
};

export default SpendingOverview;
