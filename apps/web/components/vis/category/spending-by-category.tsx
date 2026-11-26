'use client';

import { BarList, BarListProps } from '@/components/ui/bar-list';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, colours, formatCurrency } from '@/lib/ui';
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

export const SpendingByCategorySkeleton = () => (
  <div className="flex flex-col gap-1.5">
    {['w-full', 'w-2/3', 'w-1/3'].map((width) => (
      <div key={width} className="flex items-center gap-6">
        <div className="flex-1">
          <Skeleton className={cn('h-8 rounded-sm', width)} />
        </div>
        <Skeleton className="h-4 w-12" />
      </div>
    ))}
  </div>
);

export default SpendingByCategory;
