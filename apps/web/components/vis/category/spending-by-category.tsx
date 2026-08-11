'use client';

import { BarList, BarListProps } from '@/components/ui/bar-list';
import { colours, formatCurrency } from '@/lib/ui';
import { use } from 'react';

const SpendingByCategory = ({
  category,
  dataFetch,
}: {
  category?: string;
  dataFetch: Promise<BarListProps['data']>;
}) => {
  const data = use(dataFetch);

  if (data.length === 0) {
    return (
      <p className="text-muted-foreground w-full rounded border border-dashed p-4 text-center text-sm">
        No spending data
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
        formatCurrency(value, { baseUnits: true, decimals: 2 })
      }
      showAnimation
    />
  );
};

export default SpendingByCategory;
