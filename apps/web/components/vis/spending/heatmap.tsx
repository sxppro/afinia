'use client';

import { Tracker, TrackerBlockProps } from '@/components/ui/tracker';
import { heatmapEmptyColour } from '@/lib/chart';
import { cn } from '@/lib/ui';

const Heatmap = ({
  rows,
  columnLabels,
  rowClassName = 'h-4',
  className,
}: {
  rows: { label?: string; blocks: TrackerBlockProps[] }[];
  columnLabels: (string | undefined)[];
  rowClassName?: string;
  className?: string;
}) => (
  <div className={cn('flex flex-col gap-1', className)}>
    <div className="flex gap-2">
      <div className="w-7 shrink-0" />
      <div className="flex w-full">
        {columnLabels.map((label, index) => (
          <div
            key={index}
            className="text-muted-foreground min-w-0 flex-1 overflow-visible text-center text-[10px] whitespace-nowrap"
          >
            {label}
          </div>
        ))}
      </div>
    </div>
    {rows.map(({ label, blocks }, index) => (
      <div key={index} className="flex items-center gap-2">
        <div className="text-muted-foreground w-7 shrink-0 text-[10px] leading-none">
          {label}
        </div>
        <Tracker
          className={rowClassName}
          data={blocks}
          defaultBackgroundColor={heatmapEmptyColour}
          hoverEffect
        />
      </div>
    ))}
  </div>
);

export default Heatmap;
