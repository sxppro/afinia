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
    <>
      <p className="text-muted-foreground mb-3 text-sm">
        About{' '}
        <span className="text-foreground font-medium">
          {formatCurrency(total, { baseUnits: true })}
        </span>{' '}
        a month across {payments.length} payment
        {payments.length === 1 ? '' : 's'}
      </p>
      <RecurringPaymentsList payments={payments} />
    </>
  );
};

export default RecurringPayments;
