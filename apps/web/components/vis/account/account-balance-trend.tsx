'use client';

import { cn } from '@/lib/ui';
import NumberFlow, { NumberFlowGroup } from '@number-flow/react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { use } from 'react';
import CurrencyFlow from '../currency-flow';

const AccountBalanceTrend = ({
  dataFetch,
  label,
}: {
  dataFetch: Promise<
    {
      timestamp: string;
      value: number;
      openingBalance: number;
    }[]
  >;
  label: string;
}) => {
  const data = use(dataFetch);

  if (data.length === 0) {
    return (
      <p className="flex items-center gap-1.5 self-start font-medium">
        <span className="inline-flex items-center gap-1 transition">
          <CurrencyFlow
            value={0}
            signDisplay="negative"
            className="text-base font-semibold"
            hideable
          />
        </span>
        <NumberFlow
          value={0}
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
  }

  /**
   * Compare opening balance with
   * final balance
   */
  const start = data[0].openingBalance;
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
  const textColour =
    totalChange > 0
      ? 'text-emerald-500'
      : totalChange < 0
        ? 'text-red-500'
        : '';

  return (
    <p className="flex items-center gap-1.5 self-start font-medium">
      <NumberFlowGroup>
        <span
          className={cn(
            'inline-flex items-center gap-1 transition',
            textColour
          )}
        >
          {totalChange && <Icon className="size-5" />}
          <CurrencyFlow
            value={totalChange}
            signDisplay="negative"
            className="text-base font-semibold"
            hideable
          />
        </span>
        <NumberFlow
          className={cn('font-semibold', textColour)}
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
      </NumberFlowGroup>
    </p>
  );
};

export default AccountBalanceTrend;
