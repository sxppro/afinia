'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/ui';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import {
  PointerEvent,
  ReactNode,
  useCallback,
  useRef,
  useTransition,
} from 'react';

const SWIPE_THRESHOLD = 50;

const MerchantSpendingMonthNavigation = ({
  children,
  monthLabel,
  previousMonth,
  nextMonth,
}: {
  children: ReactNode;
  monthLabel: string;
  previousMonth: string | null;
  nextMonth: string | null;
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const [isPending, startTransition] = useTransition();

  const navigateToMonth = useCallback(
    (month: string | null) => {
      if (!month) return;

      startTransition(() => {
        router.push(`${pathname}?month=${month}`, { scroll: false });
      });
    },
    [pathname, router]
  );

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    pointerStart.current = { x: event.clientX, y: event.clientY };
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (
      Math.abs(deltaX) < SWIPE_THRESHOLD ||
      Math.abs(deltaX) <= Math.abs(deltaY)
    ) {
      return;
    }

    navigateToMonth(deltaX > 0 ? previousMonth : nextMonth);
  };

  return (
    <div
      className={cn(
        'touch-pan-y transition-opacity',
        isPending && 'opacity-60'
      )}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        pointerStart.current = null;
      }}
    >
      <div className="flex items-center justify-between">
        <p className="font-medium">{monthLabel}</p>
        <div>
          <Button
            variant="ghost"
            className="has-[>svg]:px-1"
            disabled={!previousMonth || isPending}
            aria-label="Previous month"
            onClick={() => navigateToMonth(previousMonth)}
          >
            <ArrowLeft className="size-5" />
          </Button>
          <Button
            variant="ghost"
            className="has-[>svg]:px-1"
            disabled={!nextMonth || isPending}
            aria-label="Next month"
            onClick={() => navigateToMonth(nextMonth)}
          >
            <ArrowRight className="size-5" />
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
};

export default MerchantSpendingMonthNavigation;
