// Tremor Tracker [v1.0.0], ported to base-ui

'use client';

import { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import React from 'react';

import { cn } from '@/lib/ui';

interface TrackerBlockProps {
  key?: string | number;
  color?: string;
  tooltip?: React.ReactNode;
  /**
   * Accessible label, required when `tooltip` is not a string
   */
  ariaLabel?: string;
  hoverEffect?: boolean;
  defaultBackgroundColor?: string;
}

const Block = ({
  color,
  tooltip,
  ariaLabel,
  defaultBackgroundColor,
  hoverEffect,
}: TrackerBlockProps) => {
  const fill = (
    <div
      className={cn(
        'size-full rounded-[1px]',
        color || defaultBackgroundColor,
        hoverEffect ? 'hover:opacity-50' : ''
      )}
    />
  );
  const blockClassName =
    'size-full overflow-hidden px-[0.5px] transition first:rounded-l-[4px] first:pl-0 last:rounded-r-[4px] last:pr-0 sm:px-px';

  // Blocks without a tooltip (e.g. padding) aren't interactive
  if (tooltip === undefined || tooltip === null) {
    return <div className={blockClassName}>{fill}</div>;
  }

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger
        openOnHover
        delay={0}
        closeDelay={0}
        aria-label={
          ariaLabel ?? (typeof tooltip === 'string' ? tooltip : undefined)
        }
        className={cn(
          blockClassName,
          'focus-visible:ring-ring rounded-[1px] outline-none focus-visible:ring-2'
        )}
      >
        {fill}
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner
          side="top"
          align="center"
          sideOffset={10}
          className="isolate z-50"
        >
          <PopoverPrimitive.Popup
            className={cn(
              // base
              'w-auto rounded-md px-2 py-1 text-sm shadow-md outline-none',
              // text color
              'text-white dark:text-gray-900',
              // background color
              'bg-gray-900 dark:bg-gray-50'
            )}
          >
            {tooltip}
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
};

Block.displayName = 'Block';

interface TrackerProps extends React.HTMLAttributes<HTMLDivElement> {
  data: TrackerBlockProps[];
  defaultBackgroundColor?: string;
  hoverEffect?: boolean;
}

const Tracker = React.forwardRef<HTMLDivElement, TrackerProps>(
  (
    {
      data = [],
      defaultBackgroundColor = 'bg-gray-400 dark:bg-gray-400',
      className,
      hoverEffect,
      ...props
    },
    forwardedRef
  ) => {
    return (
      <div
        ref={forwardedRef}
        className={cn('group flex h-8 w-full items-center', className)}
        {...props}
      >
        {data.map(({ key, ...block }, index) => (
          <Block
            key={key ?? index}
            defaultBackgroundColor={defaultBackgroundColor}
            hoverEffect={hoverEffect}
            {...block}
          />
        ))}
      </div>
    );
  }
);

Tracker.displayName = 'Tracker';

export { Tracker, type TrackerBlockProps };
