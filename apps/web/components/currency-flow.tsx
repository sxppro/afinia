import { cn, formatValueInBaseUnits } from '@/lib/ui';
import NumberFlow from '@number-flow/react';

const CurrencyFlow = ({
  className,
  value,
  signDisplay,
}: {
  className?: string;
  value: number;
  signDisplay?: keyof Intl.NumberFormatOptionsSignDisplayRegistry;
}) => {
  return (
    <NumberFlow
      className={cn('text-2xl font-semibold', className)}
      value={formatValueInBaseUnits(value)}
      format={{
        style: 'currency',
        currency: 'AUD',
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
