'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/ui';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useCallback, useTransition } from 'react';

const SpendingMonthNavigation = ({
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

  return (
    <div
      className={cn(
        'touch-pan-y transition-opacity',
        isPending && 'opacity-60'
      )}
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

export default SpendingMonthNavigation;
