import { cn } from '@/lib/ui';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';

const SpendingChange = ({ value }: { value: number }) => {
  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus;
  const textColour =
    value > 0
      ? 'text-red-600 dark:text-red-400'
      : value < 0
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-muted-foreground';

  return (
    <div className="flex items-center gap-1.5 self-start font-medium">
      <span
        className={cn(
          'inline-flex items-center gap-1 font-semibold',
          textColour
        )}
      >
        <Icon className="size-5" />
        {Math.abs(value).toFixed(0)}%
      </span>
      <p>vs the same time last month</p>
    </div>
  );
};

export default SpendingChange;
