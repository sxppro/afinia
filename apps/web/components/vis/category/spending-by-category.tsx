'use client';

import { BarList, BarListProps } from '@/components/ui/bar-list';
import { colours, formatCurrency, formatValueInBaseUnits } from '@/lib/ui';
import { use } from 'react';

const SpendingByCategory = ({
  category,
  dataFetch,
}: {
  category: string;
  dataFetch: Promise<BarListProps['data']>;
}) => {
  const data = use(dataFetch);

  if (data.length === 0) {
    return (
      <p className="w-full p-4 rounded border border-dashed text-center text-sm text-muted-foreground">
        No data
      </p>
    );
  }

  return (
    <BarList
      data={data}
      barColor={
        category && colours[category] ? colours[category].background : undefined
      }
      valueFormatter={(value) =>
        formatCurrency(formatValueInBaseUnits(value), { decimals: 2 })
      }
    />
  );
};

export default SpendingByCategory;
