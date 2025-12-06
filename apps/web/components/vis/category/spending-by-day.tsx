'use client';

import { getColorClassName } from '@/lib/chart';
import { getCategorySpendingByTimestamp } from '@/lib/db/spending';
import { cn, formatCurrency, formatValueInBaseUnits } from '@/lib/ui';
import { use } from 'react';
import { AreaChart, TooltipProps } from '../../ui/area-chart';

const Tooltip = ({ active, payload }: TooltipProps) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      className={cn(
        // base
        'rounded-md border text-sm shadow-md',
        // border color
        'border-gray-200 dark:border-gray-800',
        // background color
        'bg-white dark:bg-gray-950',
        // layout
        'flex items-stretch gap-2 p-2'
      )}
    >
      <div className={cn('w-1 rounded-xl', getColorClassName('blue', 'bg'))} />
      <div className="flex flex-col gap-1">
        <p className="font-medium text-gray-900 dark:text-gray-50">
          {payload[0].value
            ? formatCurrency(formatValueInBaseUnits(payload[0].value), {
                decimals: 2,
              })
            : ''}
        </p>
        <p className="whitespace-nowrap text-gray-700 dark:text-gray-300">
          {payload[0].index}
        </p>
      </div>
    </div>
  );
};

const SpendingByDay = ({
  dataFetch,
}: {
  dataFetch: ReturnType<typeof getCategorySpendingByTimestamp>;
}) => {
  const data = use(dataFetch);

  return (
    <AreaChart
      className="h-48"
      customTooltip={Tooltip}
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

export default SpendingByDay;
