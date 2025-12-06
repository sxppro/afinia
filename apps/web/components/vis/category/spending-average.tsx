import { getStartOfDay } from '@/lib/constants';
import { getAccount } from '@/lib/db/account';
import { db } from '@/lib/db/client';
import { getCategorySpendingByTimestamp } from '@/lib/db/spending';
import { formatCurrency, formatValueInBaseUnits } from '@/lib/ui';
import { accountTable } from 'afinia-common/schema';
import { AccountTypeEnum } from 'afinia-common/types/up-api';
import {
  differenceInMonths,
  endOfMonth,
  Interval,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { avg } from 'drizzle-orm';

const SpendingAverage = async ({ category }: { category: string }) => {
  const MIN_MONTHS = 3;
  const account = await getAccount(
    { createdAt: accountTable.created_at },
    { type: AccountTypeEnum.TRANSACTIONAL }
  );

  if (!account[0]) {
    <p className="text-3xl/tight font-semibold">{formatCurrency(0)}</p>;
  }

  // Check we have at least 3 months of data to calculate an average
  const interval: Interval = {
    start: account[0].createdAt,
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
        {formatCurrency(formatValueInBaseUnits(avgMonthlySpending[0].value), {
          decimals: 2,
        })}
      </p>
    );
  }

  return <p className="text-3xl/tight font-semibold">$—.——</p>;
};

export default SpendingAverage;
