import { Skeleton } from '@/components/ui/skeleton';
import RecurringPaymentsList from '@/components/vis/spending/recurring-payments-list';
import { getStartOfDay } from '@/lib/dateTime';
import { getRecentPaymentsByMerchant } from '@/lib/db/spending';
import { detectRecurringPayments } from '@/lib/recurring-spending';
import { formatCurrency } from '@/lib/ui';
import { endOfDay, subMonths } from 'date-fns';

const RecurringPayments = async () => {
  const today = getStartOfDay();
  /**
   * Look for recent merchant payments in the past 25 months, long enough
   * for a yearly payment to have been made twice
   */
  const recentMerchantPayments = await getRecentPaymentsByMerchant({
    range: { start: subMonths(today, 25), end: endOfDay(today) },
  });
  const payments = detectRecurringPayments(recentMerchantPayments, today);
  const total = payments.reduce((sum, { monthlyCost }) => sum + monthlyCost, 0);

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-xl font-semibold">Recurring Payments</h2>
        <p className="text-muted-foreground">
          About{' '}
          <span className="text-foreground font-medium">
            {formatCurrency(total, { baseUnits: true })}
          </span>{' '}
          a month across {payments.length} payment
          {payments.length === 1 ? '' : 's'}
        </p>
      </div>
      <RecurringPaymentsList payments={payments} />
    </section>
  );
};

export const RecurringPaymentsSkeleton = () => (
  <section className="flex flex-col gap-3">
    <div>
      <h2 className="text-xl font-semibold">Recurring Payments</h2>
      <Skeleton className="mt-1 h-5 w-56" />
    </div>
    {[...Array(4)].map((_, i) => (
      <div className="flex items-center justify-between gap-3" key={i}>
        <div className="flex items-center gap-2">
          <Skeleton className="size-2 rounded-full" />
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-6 w-16" />
      </div>
    ))}
  </section>
);

export default RecurringPayments;
