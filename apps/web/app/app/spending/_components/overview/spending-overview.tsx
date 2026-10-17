import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
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
import CategoryBreakdown from './category-breakdown';
import SpendingTotal from './spending-total';
import TopMerchants from './top-merchants';

const SpendingOverview = async () => {
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
      <Suspense fallback={<Skeleton className="h-24 w-full" />}>
        <SpendingTotal range={currentRange} previousRange={previousRange} />
      </Suspense>
      <Separator />
      <Suspense fallback={<Skeleton className="h-24 w-full" />}>
        <CategoryBreakdown range={currentRange} previousRange={previousRange} />
      </Suspense>
      <Separator />
      <Suspense fallback={<Skeleton className="h-24 w-full" />}>
        <TopMerchants range={currentRange} />
      </Suspense>
    </div>
  );
};

export default SpendingOverview;
