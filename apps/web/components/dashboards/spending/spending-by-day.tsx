'use client';

import { getCategorySpendingByTimestamp } from '@/lib/db/spending';
import { formatCurrency, formatValueInBaseUnits } from '@/lib/ui';
import { use } from 'react';
import { AreaChart } from '../../ui/area-chart';

const SpendingByDayLineChart = ({
  dataFetch,
}: {
  dataFetch: ReturnType<typeof getCategorySpendingByTimestamp>;
}) => {
  const data = use(dataFetch);

  return (
    <AreaChart
      className="h-48"
      data={data}
      index="timestamp"
      categories={['value']}
      startEndOnly
      showLegend={false}
      showYAxis={false}
      valueFormatter={(value) => formatCurrency(formatValueInBaseUnits(value))}
    />
  );
};

export default SpendingByDayLineChart;
