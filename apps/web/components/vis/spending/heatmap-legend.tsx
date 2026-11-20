'use client';

import { Tracker } from '@/components/ui/tracker';

const HeatmapLegend = ({
  palette,
  thresholds,
  min,
  max,
  formatValue,
}: {
  palette: readonly string[];
  thresholds: number[];
  min: number;
  max: number;
  formatValue: (value: number) => string;
}) => {
  const blocks = palette.map((color, index) => {
    const lower = formatValue(index === 0 ? min : thresholds[index - 1]);
    const upper = formatValue(thresholds[index] ?? max);

    return {
      key: color,
      color,
      tooltip: lower === upper ? lower : `${lower}—${upper}`,
    };
  });

  return (
    <div className="text-muted-foreground grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs">
      <span className="text-end">{formatValue(min)}</span>
      <Tracker className="h-3 w-36" data={blocks} hoverEffect />
      <span>{formatValue(max)}</span>
    </div>
  );
};

export default HeatmapLegend;
