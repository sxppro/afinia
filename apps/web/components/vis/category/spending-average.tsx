import { getStartOfDay } from '@/lib/dateTime';
import { db } from '@/lib/db/client';
import { getCategorySpendingByTimestamp } from '@/lib/db/spending';
import { formatCurrency } from '@/lib/ui';
import { AccountTypeEnum } from 'afinia-common/providers/up';
import { accountTable } from 'afinia-common/schema';
import {
  differenceInMonths,
  endOfMonth,
  Interval,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { avg, eq } from 'drizzle-orm';

const SpendingAverage = async ({ category }: { category: string }) => {
  const MIN_MONTHS = 3;
  const [account] = await db
    .select({ createdAt: accountTable.created_at })
    .from(accountTable)
    .where(eq(accountTable.type, AccountTypeEnum.TRANSACTIONAL))
    .limit(1);

  if (!account) {
    <p className="text-3xl/tight font-semibold">{formatCurrency(0)}</p>;
  }

  // Check we have at least 3 months of data to calculate an average
  const interval: Interval = {
    start: account.createdAt,
    end: getStartOfDay(),
  };
  const months = differenceInMonths(interval.end, interval.start);
  if (months >= MIN_MONTHS) {
    const avgInterval = {
      start: startOfMonth(subMonths(getStartOfDay(), MIN_MONTHS)),
      end: endOfMonth(subMonths(getStartOfDay(), 1)),
    };
    const monthlySpendingQuery = getCategorySpendingByTimestamp({
      category,
      interval: 'month',
      range: avgInterval,
    }).as('monthlySpendingQuery');
    const avgMonthlySpending = await db
      .select({ value: avg(monthlySpendingQuery.value).mapWith(Number) })
      .from(monthlySpendingQuery);

    return (
      <p className="text-3xl/tight font-semibold">
        {formatCurrency(avgMonthlySpending[0].value, {
          baseUnits: true,
          decimals: 2,
        })}
      </p>
    );
  }

  return <p className="text-3xl/tight font-semibold">$—.——</p>;
};

export default SpendingAverage;
