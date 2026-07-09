'use client';

import CurrencyFlow from '@/components/currency-flow';
import { cn, formatCurrency } from '@/lib/ui';
import NumberFlow from '@number-flow/react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { use } from 'react';

const AccountBalanceTrend = ({
  dataFetch,
  label,
}: {
  dataFetch: Promise<
    {
      timestamp: string;
      value: number;
    }[]
  >;
  label: string;
}) => {
  const data = use(dataFetch);

  if (data.length < 2) {
    return (
      <p className="font-semibold">
        - {formatCurrency(0)} (0%) {label}
      </p>
    );
  }

  const start = data[0].value;
  const end = data[data.length - 1].value;
  const totalChange = end - start;
  const totalChangeDecimal =
    start === 0
      ? end > 0
        ? 1
        : end < 0
          ? -1
          : 0
      : totalChange / Math.abs(start);
  const Icon = totalChange > 0 ? TrendingUp : TrendingDown;

  return (
    <p className="flex items-center gap-1.5 self-start font-medium">
      <span
        className={cn(
          'inline-flex items-center gap-1 transition',
          totalChange > 0 ? 'text-emerald-500' : 'text-red-500'
        )}
      >
        <Icon className="size-4" />
        <CurrencyFlow
          value={totalChange}
          signDisplay="negative"
          className="text-base font-semibold"
        />
      </span>
      <NumberFlow
        value={totalChangeDecimal}
        format={{
          style: 'percent',
          maximumFractionDigits: 1,
          signDisplay: 'never',
        }}
        prefix="("
        suffix=")"
      />
      <span>over {label}</span>
    </p>
  );
};

export default AccountBalanceTrend;
