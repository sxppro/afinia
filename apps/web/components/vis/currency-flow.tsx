import { DEFAULT_CURRENCY } from '@/lib/constants';
import { cn, formatValueInBaseUnits } from '@/lib/ui';
import NumberFlow from '@number-flow/react';

const CurrencyFlow = ({
  className,
  value,
  signDisplay,
  currency,
}: {
  className?: string;
  value: number;
  signDisplay?: keyof Intl.NumberFormatOptionsSignDisplayRegistry;
  currency?: string;
}) => {
  return (
    <NumberFlow
      className={cn('text-2xl font-semibold', className)}
      value={formatValueInBaseUnits(value, currency ?? DEFAULT_CURRENCY)}
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
