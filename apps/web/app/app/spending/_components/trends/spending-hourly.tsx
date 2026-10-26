import SpendingByHourHeatmapChart from '@/components/vis/spending/spending-by-hour-heatmap';
import { getStartOfDay } from '@/lib/dateTime';
import { getSpendingByHourAndWeekday } from '@/lib/db/spending';
import { endOfDay, startOfMonth, subMonths } from 'date-fns';

const SpendingHourly = async () => {
  const today = getStartOfDay();
  const cells = await getSpendingByHourAndWeekday({
    start: startOfMonth(subMonths(today, 11)),
    end: endOfDay(today),
  });

  return <SpendingByHourHeatmapChart cells={cells} />;
};

export default SpendingHourly;
