import SpendingPaceChart from '@/components/vis/spending/spending-pace';
import { getStartOfDay, toYearMonth } from '@/lib/dateTime';
import { getSpendingTimeSeries } from '@/lib/db/spending';
import {
  endOfMonth,
  format,
  getDate,
  getDaysInMonth,
  startOfMonth,
  subMonths,
} from 'date-fns';

/**
 * Running totals by day of month
 */
const getRunningTotals = (values: (number | null)[]) => {
  let total = 0;
  return values.map((value) => (value === null ? null : (total += value)));
};

/**
 * Get running total at a given day
 */
const getTotalAtDay = (totals: (number | null)[], day: number) =>
  totals[Math.min(day, totals.length) - 1] ?? 0;

/**
 * Average running total at `day` across the given months
 */
const getAverageAtDay = (
  months: { totals: (number | null)[] }[],
  day: number
) =>
  months.length > 0
    ? Math.round(
        months.reduce(
          (sum, { totals }) => sum + getTotalAtDay(totals, day),
          0
        ) / months.length
      )
    : 0;

const SpendingPace = async () => {
  const today = getStartOfDay();
  // Get daily spending for this month and past 12 months
  const dailySpending = await getSpendingTimeSeries({
    interval: 'day',
    range: {
      start: startOfMonth(subMonths(today, 12)),
      end: endOfMonth(today),
    },
  });

  // Collate daily spending by their month (YYYY-MM)
  const spendingByMonth = new Map<string, (number | null)[]>();
  for (const { date, value } of dailySpending) {
    const month = toYearMonth(date);
    spendingByMonth.set(month, [...(spendingByMonth.get(month) ?? []), value]);
  }

  const currentMonth = format(today, 'yyyy-MM');
  const lastMonth = format(subMonths(today, 1), 'yyyy-MM');

  // Cumulative total spending (by day) for the current month and previous months
  const currentMonthTotals = getRunningTotals(
    spendingByMonth.get(currentMonth) ?? []
  );
  const previousMonths = [...spendingByMonth.entries()]
    .filter(([month]) => month !== currentMonth)
    .map(([month, values]) => ({ month, totals: getRunningTotals(values) }));
  const lastMonthTotals =
    previousMonths.find(({ month }) => month === lastMonth)?.totals ?? [];

  // Build chart data
  const data = Array.from({ length: getDaysInMonth(today) }, (_, index) => ({
    day: `Day ${index + 1}`,
    'This month': currentMonthTotals[index] ?? null,
    'Last month': getTotalAtDay(lastMonthTotals, index + 1),
    '12-month avg': getAverageAtDay(previousMonths, index + 1),
  }));
  // Spending so far this month
  const currentSpend = currentMonthTotals[getDate(today) - 1] ?? 0;
  // Difference between current spend and 12-month average
  const currentSpendDiff =
    currentSpend - getAverageAtDay(previousMonths, getDate(today));

  return (
    <SpendingPaceChart
      data={data}
      currentSpend={currentSpend}
      difference={currentSpendDiff}
    />
  );
};

export default SpendingPace;
