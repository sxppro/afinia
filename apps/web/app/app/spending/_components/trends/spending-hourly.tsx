import SpendingByHourHeatmapChart from '@/components/vis/spending/spending-by-hour-heatmap';
import { getStartOfDay } from '@/lib/dateTime';
import { getSpendingByHourAndWeekday } from '@/lib/db/spending';
import { endOfDay, startOfMonth, subMonths } from 'date-fns';
import { connection } from 'next/server';

/**
 * Spending heatmap by day of week and hour over 12 months
 */
const SpendingHourly = async ({ category }: { category?: string }) => {
  await connection();
  const today = getStartOfDay();
  const cells = await getSpendingByHourAndWeekday({
    range: {
      start: startOfMonth(subMonths(today, 11)),
      end: endOfDay(today),
    },
    category,
  });

  return <SpendingByHourHeatmapChart cells={cells} />;
};

export default SpendingHourly;
