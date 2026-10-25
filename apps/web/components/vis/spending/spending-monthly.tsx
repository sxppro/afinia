'use client';

import { BarChart, TooltipProps } from '@/components/ui/bar-chart';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getColorClassName } from '@/lib/chart';
import { cn, formatCurrency } from '@/lib/ui';
import { useState } from 'react';

const MODES = [
  { id: 'total', label: 'Total' },
  { id: 'category', label: 'By category' },
] as const;

const tooltipValue = (value: number) =>
  formatCurrency(value, { baseUnits: true });

// Payload colours are fill classes, e.g. fill-blue-500 -> bg-blue-500
const toBackground = (color?: string) =>
  color?.replace('fill', 'bg') ?? getColorClassName('blue', 'bg');

const Tooltip = ({ active, payload }: TooltipProps) => {
  if (!active || !payload || payload.length === 0) return null;

  const [first] = payload;
  const label = `${first.index}${first.payload?.partial ? ' · Partial' : ''}`;
  // Stacked bars include every category, so hide those without spending
  const items = payload
    .filter(({ value }) => value > 0)
    .sort((a, b) => b.value - a.value);

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
        'p-2'
      )}
    >
      {payload.length === 1 ? (
        <div className="flex items-stretch gap-2">
          <div className={cn('w-1 rounded-xl', toBackground(first.color))} />
          <div className="flex flex-col gap-1">
            <p className="font-medium text-gray-900 dark:text-gray-50">
              {tooltipValue(first.value)}
            </p>
            <p className="whitespace-nowrap text-gray-700 dark:text-gray-300">
              {label}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <p className="whitespace-nowrap text-gray-700 dark:text-gray-300">
            {label}
          </p>
          {items.map(({ category, value, color }) => (
            <div key={category} className="flex items-stretch gap-2">
              <div className={cn('w-1 rounded-xl', toBackground(color))} />
              <p className="flex-1 whitespace-nowrap text-gray-700 dark:text-gray-300">
                {category}
              </p>
              <p className="font-medium text-gray-900 dark:text-gray-50">
                {tooltipValue(value)}
              </p>
            </div>
          ))}
          <Separator />
          <div className="flex items-stretch gap-2">
            <p className="flex-1 font-medium whitespace-nowrap text-gray-700 dark:text-gray-300">
              Total
            </p>
            <p className="font-medium text-gray-900 dark:text-gray-50">
              {tooltipValue(items.reduce((sum, { value }) => sum + value, 0))}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const SpendingMonthly = ({
  data,
  average,
  categoryNames,
  categoryColors,
}: {
  // One row per month with a `Total` and a value per category name
  data: Record<string, string | number | boolean>[];
  average: number;
  categoryNames: string[];
  categoryColors: string[];
}) => {
  const [mode, setMode] = useState<(typeof MODES)[number]['id']>('total');
  const valueFormatter = (value: number) =>
    formatCurrency(value, { baseUnits: true, compact: true });

  return (
    <>
      <div
        role="radiogroup"
        aria-label="Monthly spending breakdown"
        className="bg-muted mb-2 inline-grid w-full grid-cols-2 rounded-lg p-0.5"
      >
        {MODES.map(({ id, label }) => (
          <Button
            key={id}
            size="sm"
            variant={mode === id ? 'outline' : 'ghost'}
            role="radio"
            aria-checked={mode === id}
            onClick={() => setMode(id)}
            className={cn(
              'text-xs',
              mode === id
                ? 'dark:bg-background border-transparent dark:border-transparent'
                : 'text-muted-foreground'
            )}
          >
            {label}
          </Button>
        ))}
      </div>
      {mode === 'total' ? (
        <BarChart
          className="h-72"
          data={data}
          index="month"
          categories={['Total']}
          colors={['fill-blue-500']}
          showYAxis={false}
          startEndOnly
          referenceValue={average}
          isPartial={(row) => row.partial === true}
          valueFormatter={valueFormatter}
          customTooltip={Tooltip}
        />
      ) : (
        <BarChart
          className="h-72"
          data={data}
          index="month"
          categories={categoryNames}
          colors={categoryColors}
          type="stacked"
          showYAxis={false}
          enableLegendSlider
          startEndOnly
          isPartial={(row) => row.partial === true}
          valueFormatter={valueFormatter}
          customTooltip={Tooltip}
        />
      )}
    </>
  );
};

export default SpendingMonthly;
