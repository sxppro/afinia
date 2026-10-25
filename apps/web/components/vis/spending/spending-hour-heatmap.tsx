'use client';

import { getHeatmapColour, getHeatmapThresholds } from '@/lib/chart';
import { formatCurrency } from '@/lib/ui';
import Heatmap from './heatmap';

const weekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const formatHour = (hour: number) =>
  `${hour % 12 === 0 ? 12 : hour % 12}${hour < 12 ? 'am' : 'pm'}`;

const SpendingHourHeatmap = ({
  cells,
}: {
  cells: {
    weekday: number;
    hour: number;
    value: number;
    transactions: number;
  }[];
}) => {
  const thresholds = getHeatmapThresholds(cells.map(({ value }) => value));
  const cellByKey = new Map(
    cells.map((cell) => [`${cell.weekday}-${cell.hour}`, cell])
  );

  const rows = weekdayNames.map((weekdayName, weekdayIndex) => ({
    label: weekdayName,
    blocks: Array.from({ length: 24 }, (_, hour) => {
      const cell = cellByKey.get(`${weekdayIndex + 1}-${hour}`);
      const value = cell?.value ?? 0;
      const transactions = cell?.transactions ?? 0;

      return {
        key: hour,
        color: getHeatmapColour(value, thresholds),
        tooltip: `${weekdayName} ${formatHour(hour)} · ${formatCurrency(value, { baseUnits: true })} across ${transactions} transaction${transactions === 1 ? '' : 's'}`,
      };
    }),
  }));

  return (
    <Heatmap
      rows={rows}
      columnLabels={Array.from({ length: 24 }, (_, hour) =>
        hour % 6 === 0 ? formatHour(hour) : undefined
      )}
    />
  );
};

export default SpendingHourHeatmap;
