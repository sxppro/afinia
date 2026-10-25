import SpendingByMonth from '@/components/vis/spending/spending-by-month';
import { getStartOfDay, toYearMonth } from '@/lib/dateTime';
import {
  getSpendingByCategory,
  getSpendingByCategoryAndMonth,
  getSpendingTimeSeries,
} from '@/lib/db/spending';
import { colours } from '@/lib/ui';
import {
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  subMonths,
} from 'date-fns';

const SpendingMonthly = async () => {
  const today = getStartOfDay();
  // Last 12 months
  const range = {
    start: startOfMonth(subMonths(today, 11)),
    end: endOfMonth(today),
  };
  const [monthlyTimeSeries, monthlyCategorySpending, totalCategorySpend] =
    await Promise.all([
      // Monthly spending time series
      getSpendingTimeSeries({ interval: 'month', range }),
      // Total spending by category each month (excluding months without spending)
      getSpendingByCategoryAndMonth(range),
      // Total spending by category over last 12 months
      getSpendingByCategory(range),
    ]);

  const currentMonth = format(today, 'yyyy-MM');
  // Build rows based on time series data
  const rows = new Map(
    monthlyTimeSeries.map(({ date, value }) => {
      const month = toYearMonth(date); // YYYY-MM
      return [
        month,
        {
          partial: month === currentMonth,
          month: format(parseISO(date), 'MMM yy'),
          Total: value ?? 0,
          ...Object.fromEntries(
            totalCategorySpend.map(({ name }) => [name, 0])
          ),
        } as Record<string, string | number | boolean>,
      ];
    })
  );

  // Set category spending for each month
  for (const spending of monthlyCategorySpending) {
    const month = rows.get(spending.month);
    if (month) month[spending.categoryName] = spending.value;
  }

  // Calculate average based on previous months
  const completeMonths = monthlyTimeSeries.filter(
    ({ date }) => toYearMonth(date) !== currentMonth
  );
  const average =
    completeMonths.reduce((sum, { value }) => sum + (value ?? 0), 0) /
    Math.max(completeMonths.length, 1);

  return (
    <SpendingByMonth
      data={[...rows.values()]}
      average={Math.round(average)}
      categoryNames={totalCategorySpend.map(({ name }) => name)}
      categoryColors={totalCategorySpend.map(
        ({ id }) => colours[id]?.fill ?? 'fill-up-uncategorised'
      )}
    />
  );
};

export default SpendingMonthly;
