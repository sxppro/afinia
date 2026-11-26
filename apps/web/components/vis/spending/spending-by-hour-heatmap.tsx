'use client';

import {
  categoryHeatmapColours,
  getHeatmapColour,
  getHeatmapThresholds,
  heatmapColours,
} from '@/lib/chart';
import { formatCurrency } from '@/lib/ui';
import Heatmap from './heatmap';
import HeatmapLegend from './heatmap-legend';

const weekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const formatHour = (hour: number) =>
  `${hour % 12 === 0 ? 12 : hour % 12}${hour < 12 ? 'am' : 'pm'}`;

const SpendingByHourHeatmap = ({
  cells,
  colour,
  emptyMessage = 'No spending data',
}: {
  colour?: string;
  emptyMessage?: string;
  cells: {
    weekday: number;
    hour: number;
    value: number;
    transactions: number;
  }[];
}) => {
  const palette = (colour && categoryHeatmapColours[colour]) || heatmapColours;
  const values = cells.map(({ value }) => value);
  const thresholds = getHeatmapThresholds(values, palette.length);
  const cellByKey = new Map(
    cells.map((cell) => [`${cell.weekday}-${cell.hour}`, cell])
  );

  // One row per hour (labelled every 3 hours), one column per weekday
  const rows = Array.from({ length: 24 }, (_, hour) => ({
    label: hour % 3 === 0 ? formatHour(hour) : undefined,
    blocks: weekdayNames.map((weekdayName, weekdayIndex) => {
      const cell = cellByKey.get(`${weekdayIndex + 1}-${hour}`);
      const value = cell?.value ?? 0;
      const transactions = cell?.transactions ?? 0;

      return {
        key: weekdayName,
        color: getHeatmapColour(value, thresholds, palette),
        tooltip: `${weekdayName} ${formatHour(hour)} · ${formatCurrency(value, { baseUnits: true })} across ${transactions} transaction${transactions === 1 ? '' : 's'}`,
      };
    }),
  }));

  if (values.length === 0) {
    return (
      <p className="text-muted-foreground w-full rounded border border-dashed p-4 text-center text-sm">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Heatmap
        className="gap-[1px]"
        rows={rows}
        columnLabels={weekdayNames}
        rowClassName="h-3"
      />
      <HeatmapLegend
        palette={palette}
        thresholds={thresholds}
        min={Math.min(...values)}
        max={Math.max(...values)}
        formatValue={(value) => formatCurrency(value, { baseUnits: true })}
      />
    </div>
  );
};

export default SpendingByHourHeatmap;
