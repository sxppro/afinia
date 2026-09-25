import SpendingTrendsCharts from '@/components/vis/spending/spending-trends-charts';
import { getStartOfDay } from '@/lib/dateTime';
import {
  getCategorySpendingByTimestamp,
  getSpendingByDay,
  getSpendingCategoriesByMonth,
} from '@/lib/db/spending';
import { colours } from '@/lib/ui';
import { endOfMonth, getISODay, parseISO, startOfMonth, subMonths } from 'date-fns';

const weekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const SpendingTrends = async () => {
  const today = getStartOfDay();
  const range = {
    start: startOfMonth(subMonths(today, 11)),
    end: endOfMonth(today),
  };
  const [monthly, days, categoryRows] = await Promise.all([
    getCategorySpendingByTimestamp({ interval: 'month', range }),
    getSpendingByDay({ range }),
    getSpendingCategoriesByMonth(range),
  ]);

  const weekdayTotals = Array.from({ length: 7 }, () => ({
    value: 0,
    days: 0,
  }));
  for (const day of days) {
    if (day.value === null) continue;
    const index = getISODay(parseISO(day.date)) - 1;
    weekdayTotals[index].value += day.value;
    weekdayTotals[index].days += 1;
  }

  const categoryTotals = new Map<
    string,
    { name: string; value: number }
  >();
  for (const row of categoryRows) {
    const category = categoryTotals.get(row.categoryId);
    categoryTotals.set(row.categoryId, {
      name: row.categoryName,
      value: (category?.value ?? 0) + row.value,
    });
  }
  const categoryIds = [...categoryTotals.entries()]
    .sort((a, b) => b[1].value - a[1].value)
    .map(([id]) => id);
  const categoryNames = categoryIds.map(
    (id) => categoryTotals.get(id)?.name ?? id
  );
  const categoryNameById = new Map(
    categoryIds.map((id, index) => [id, categoryNames[index]])
  );
  const categoryMonths = new Map<string, Record<string, string | number>>();
  for (const row of categoryRows) {
    const month = categoryMonths.get(row.month) ?? { month: row.month };
    month[categoryNameById.get(row.categoryId) ?? row.categoryName] = row.value;
    categoryMonths.set(row.month, month);
  }

  return (
    <SpendingTrendsCharts
      monthly={monthly.map(({ timestamp, value }) => ({
        month: timestamp,
        Spent: value ?? 0,
      }))}
      weekdays={weekdayTotals.map(({ value, days: dayCount }, index) => ({
        day: weekdayNames[index],
        Average: dayCount > 0 ? Math.round(value / dayCount) : 0,
      }))}
      categoryMonths={[...categoryMonths.values()]}
      categoryNames={categoryNames}
      categoryColors={categoryIds.map(
        (id) => colours[id]?.fill ?? 'fill-gray-500'
      )}
    />
  );
};

export default SpendingTrends;
