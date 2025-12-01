import { getStartOfDay } from '@/lib/constants';
import { getCategorySpending } from '@/lib/db/spending';
import { DateRange } from '@/lib/types';
import { cn, formatValueInBaseUnits } from '@/lib/ui';
import NumberFlow from '@number-flow/react';
import { transactionExternalTable } from 'afinia-common/schema';
import { endOfMonth, startOfMonth } from 'date-fns';
import { sum } from 'drizzle-orm';

const SpendingTotalByCategory = async ({
  category,
  className,
}: {
  category: string;
  className?: string;
}) => {
  const range: DateRange = {
    from: startOfMonth(getStartOfDay()),
    to: endOfMonth(getStartOfDay()),
  };
  const spending = await getCategorySpending({
    select: {
      id: transactionExternalTable.category_parent_id,
      name: transactionExternalTable.category_parent,
      value: sum(transactionExternalTable.value_in_base_units).mapWith(Number),
    },
    range,
    category,
  }).groupBy(
    transactionExternalTable.category_parent_id,
    transactionExternalTable.category_parent
  );

  return (
    <NumberFlow
      className={cn('text-2xl font-semibold', className)}
      value={spending[0] ? formatValueInBaseUnits(spending[0].value) : 0}
      format={{
        style: 'currency',
        currency: 'AUD',
        currencyDisplay: 'narrowSymbol',
      }}
    />
  );
};

export default SpendingTotalByCategory;
