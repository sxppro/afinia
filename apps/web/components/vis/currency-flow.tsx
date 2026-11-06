'use client';

import { DEFAULT_CURRENCY } from '@/lib/constants';
import { cn, formatValueInBaseUnits } from '@/lib/ui';
import NumberFlow, { Format } from '@number-flow/react';
import { useBalanceVisibility } from '../balance-visibility';

const CurrencyFlow = ({
  className,
  value,
  currency,
  hideable,
  options,
}: {
  className?: string;
  value: number;
  currency?: string;
  hideable?: boolean;
  options?: Format;
}) => {
  const { isVisible } = useBalanceVisibility();

  return (
    <NumberFlow
      className={cn('text-2xl font-semibold', className)}
      value={
        // Show infinity if value is hidden
        hideable && !isVisible
          ? Infinity
          : formatValueInBaseUnits(value, currency ?? DEFAULT_CURRENCY)
      }
      format={{
        style: 'currency',
        currency: currency ?? DEFAULT_CURRENCY,
        currencyDisplay: 'narrowSymbol',
        signDisplay: value > 0 ? 'exceptZero' : 'never',
        ...options,
      }}
    />
  );
};

export default CurrencyFlow;
