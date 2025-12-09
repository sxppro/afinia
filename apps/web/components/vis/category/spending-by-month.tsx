'use client';

import { BarChart, TooltipProps } from '@/components/ui/bar-chart';
import { getColorClassName } from '@/lib/chart';
import { getCategorySpendingByTimestamp } from '@/lib/db/spending';
import { cn, colours, formatCurrency } from '@/lib/ui';
import { use } from 'react';

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
      <div
        className={cn(
          'w-1 rounded-xl',
          payload[0].color?.replace('fill', 'bg') ??
            getColorClassName('blue', 'bg')
        )}
      />
      <div className="flex flex-col gap-1">
        <p className="font-medium text-gray-900 dark:text-gray-50">
          {formatCurrency(payload[0].value, {
            baseUnits: true,
            decimals: 2,
          })}
        </p>
        <p className="whitespace-nowrap text-gray-700 dark:text-gray-300">
          {payload[0].index}
        </p>
      </div>
    </div>
  );
};

const SpendingByMonth = ({
  category,
  dataFetch,
}: {
  category: string;
  dataFetch: ReturnType<typeof getCategorySpendingByTimestamp>;
}) => {
  const data = use(dataFetch);

  return (
    <BarChart
      className="h-48"
      data={data}
      index="timestamp"
      colors={
        category && colours[category] ? [colours[category].fill] : undefined
      }
      categories={['value']}
      startEndOnly
      showLegend={false}
      showYAxis={false}
      customTooltip={Tooltip}
      valueFormatter={(value) => formatCurrency(value, { baseUnits: true })}
    />
  );
};

export default SpendingByMonth;
