import SpendingHourHeatmapChart from '@/components/vis/spending/spending-hour-heatmap';
import { getStartOfDay } from '@/lib/dateTime';
import { getSpendingByHourAndWeekday } from '@/lib/db/spending';
import { endOfDay, startOfMonth, subMonths } from 'date-fns';

const SpendingHourHeatmap = async () => {
  const today = getStartOfDay();
  const cells = await getSpendingByHourAndWeekday({
    start: startOfMonth(subMonths(today, 11)),
    end: endOfDay(today),
  });

  return <SpendingHourHeatmapChart cells={cells} />;
};

export default SpendingHourHeatmap;
