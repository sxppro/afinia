import { cn, formatValueInBaseUnits } from '@/lib/ui';
import NumberFlow from '@number-flow/react';

const CurrencyFlow = ({
  className,
  value,
}: {
  className?: string;
  value: number;
}) => {
  return (
    <NumberFlow
      className={cn('text-2xl font-semibold', className)}
      value={formatValueInBaseUnits(value)}
      format={{
        style: 'currency',
        currency: 'AUD',
        currencyDisplay: 'narrowSymbol',
        signDisplay: value > 0 ? 'exceptZero' : 'never',
      }}
    />
  );
};

export default CurrencyFlow;
