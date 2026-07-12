'use client';

import { DEFAULT_CURRENCY } from '@/lib/constants';
import { cn, formatValueInBaseUnits } from '@/lib/ui';
import NumberFlow from '@number-flow/react';
import { useBalanceVisibility } from '../balance-visibility';

const CurrencyFlow = ({
  className,
  value,
  signDisplay,
  currency,
  hideable,
}: {
  className?: string;
  value: number;
  signDisplay?: keyof Intl.NumberFormatOptionsSignDisplayRegistry;
  currency?: string;
  hideable?: boolean;
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
        signDisplay: signDisplay
          ? signDisplay
          : value > 0
            ? 'exceptZero'
            : 'never',
      }}
    />
  );
};

export default CurrencyFlow;
