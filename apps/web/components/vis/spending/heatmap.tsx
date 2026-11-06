'use client';

import { Tracker, TrackerBlockProps } from '@/components/ui/tracker';
import { heatmapEmptyColour } from '@/lib/chart';
import { cn } from '@/lib/ui';

/**
 * Grid of `Tracker` rows with labels down the left and along the top
 */
const Heatmap = ({
  rows,
  columnLabels,
  centerColumnLabels = false,
  rowClassName = 'h-4',
  className,
}: {
  rows: { label?: string; blocks: TrackerBlockProps[] }[];
  /**
   * One entry per column, `undefined` for columns without a label
   */
  columnLabels: (string | undefined)[];
  /**
   * Centre labels over their column, rather than letting them overflow right
   */
  centerColumnLabels?: boolean;
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
            className={cn(
              'text-muted-foreground min-w-0 flex-1 overflow-visible text-[10px] whitespace-nowrap',
              centerColumnLabels && 'text-center'
            )}
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
