'use client';

import { BarList, BarListProps } from '@/components/ui/bar-list';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, colours, formatCurrency } from '@/lib/ui';
import { ChevronDown } from 'lucide-react';
import { FocusEvent, use, useId, useState } from 'react';

const ROW_HEIGHT = 32;
const ROW_GAP = 6;
const listHeight = (rows: number) => rows * ROW_HEIGHT + (rows - 1) * ROW_GAP;

const SpendingByCategory = ({
  category,
  dataFetch,
  limit,
}: {
  category?: string;
  dataFetch: Promise<BarListProps['data']>;
  limit?: number;
}) => {
  const data = use(dataFetch);
  const [open, setOpen] = useState(false);
  const listId = useId();

  if (data.length === 0) {
    return (
      <p className="text-muted-foreground w-full rounded border border-dashed p-4 text-center text-sm">
        No spending data
      </p>
    );
  }

  const barList = (
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

  if (!limit || data.length <= limit) return barList;

  const collapsedHeight = listHeight(limit);

  // Expand when keyboard focus lands on a hidden row
  const handleFocus = (event: FocusEvent<HTMLDivElement>) => {
    if (open) return;
    const top =
      event.target.getBoundingClientRect().top -
      event.currentTarget.getBoundingClientRect().top;
    if (top >= collapsedHeight) setOpen(true);
  };

  return (
    <div className="relative">
      <div
        id={listId}
        className="ease-out-nice overflow-hidden transition duration-300"
        style={{ maxHeight: open ? listHeight(data.length) : collapsedHeight }}
        onFocusCapture={handleFocus}
      >
        {barList}
      </div>
      <div
        className={cn(
          'from-background ease-out-nice pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t to-transparent transition-opacity duration-300',
          open && 'opacity-0'
        )}
      />
      <div
        className={cn(
          'ease-out-nice pointer-events-none relative flex justify-center transition-[margin] duration-300',
          open ? 'mt-2' : '-mt-8'
        )}
      >
        <Button
          variant="outline"
          size="sm"
          className="pointer-events-auto"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? 'Show less' : `Show more`}
          <ChevronDown
            className={cn(
              'ease-out-nice transition-transform duration-300',
              open && 'rotate-180'
            )}
          />
        </Button>
      </div>
    </div>
  );
};

export const SpendingByCategorySkeleton = () => (
  <div className="flex flex-col gap-1.5">
    {['w-full', 'w-3/4', 'w-1/2', 'w-1/3'].map((width) => (
      <div key={width} className="flex items-center gap-6">
        <div className="flex-1">
          <Skeleton className={cn('h-8 rounded-sm', width)} />
        </div>
        <Skeleton className="h-6 w-12" />
      </div>
    ))}
  </div>
);

export default SpendingByCategory;
