'use client';

import { BarChart } from '@/components/ui/bar-chart';
import { getCategorySpendingByTimestamp } from '@/lib/db/spending';
import { formatCurrency } from '@/lib/ui';
import { use } from 'react';

const SpendingByMonth = ({
  dataFetch,
}: {
  dataFetch: ReturnType<typeof getCategorySpendingByTimestamp>;
}) => {
  const data = use(dataFetch);

  return (
    <BarChart
      className="h-48"
      data={data}
      index="timestamp"
      categories={['value']}
      startEndOnly
      showLegend={false}
      showYAxis={false}
      valueFormatter={(value) => formatCurrency(value, { baseUnits: true })}
    />
  );
};

export default SpendingByMonth;
